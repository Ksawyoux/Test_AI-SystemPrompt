import google.generativeai as genai
from pypdf import PdfReader
import json
import re
import csv
from io import StringIO, BytesIO
from typing import Optional, Tuple, List
import os

# --- CONSTANTS ---
MODEL_NAME = "gemini-2.5-flash"
MAX_QUESTIONS = 10

JD_TEMPLATE = """
**Job Title:** [Role Name]

**Company Information:**
Join a dynamic team at **[Company Name]**, a leader in innovative technology...

**Key Responsibilities:**
- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]

**Qualifications:**
- [Qualification 1]
- [Qualification 2]
- [Qualification 3]

**Nice to Have:**
- [Optional Skill 1]
- [Optional Skill 2]
"""

# --- HELPER FUNCTIONS ---

def extract_pdf_text(file_content: bytes) -> str:
    """Extract text content from a PDF file."""
    try:
        reader = PdfReader(BytesIO(file_content))
        text = "".join([page.extract_text() or "" for page in reader.pages])
        return text.strip()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def parse_questions_from_csv(raw_text: str) -> list[dict]:
    """
    Parse interview questions from CSV-style output.
    Handles quoted strings with commas and filters noise.
    """
    questions = []
    
    # Clean markdown code blocks
    clean_text = re.sub(r'```\w*\n?', '', raw_text).strip()
    
    # Extract only data lines (starting with a number)
    data_lines = []
    for line in clean_text.split('\n'):
        line = line.strip()
        if re.match(r'^\d+\s*,', line):
            data_lines.append(line)
    
    if not data_lines:
        return questions
    
    # Parse using CSV reader
    reader = csv.reader(StringIO('\n'.join(data_lines)), skipinitialspace=True)
    
    for row in reader:
        if len(row) >= 6:
            try:
                questions.append({
                    "id": int(row[0].strip()),
                    "title": row[1].strip().strip('"'),
                    "question_text": row[2].strip().strip('"'),
                    "difficulty": row[3].strip().strip('"'),
                    "max_points": int(row[4].strip()),
                    "scoring_criteria": row[5].strip().strip('"')
                })
            except (ValueError, IndexError) as e:
                print(f"Skipped malformed row: {e}")
    
    return questions


def evaluate_single_response(
    model: genai.GenerativeModel,
    question: dict,
    response: str,
    code_snippet: Optional[str] = None
) -> dict:
    """Evaluate a single interview response using Gemini."""
    
    code_context = ""
    if code_snippet:
        code_context = f"""
CANDIDATE'S CODE SNIPPET:
```
{code_snippet}
```
Evaluation Instruction: Please also evaluate the correctness and quality of the above code snippet relative to the question.
"""

    prompt = f"""
You are an expert technical interviewer evaluating a candidate's response.

QUESTION:
Title: {question.get('title', 'Unknown')}
Question: {question.get('question_text', '')}
Difficulty: {question.get('difficulty', 'Medium')}
Max Points: {question.get('max_points', 10)}
Scoring Criteria: {question.get('scoring_criteria', 'Evaluate for accuracy and depth')}

{code_context}

CANDIDATE'S VERBAL RESPONSE:
"{response}"

TASK:
Evaluate the response (and code if provided) and provide:
1. A score out of the max points
2. Brief feedback on what was good
3. Brief feedback on what could be improved

OUTPUT (JSON only):
{{
    "score": 7,
    "max_points": 10,
    "feedback_positive": "Brief positive feedback",
    "feedback_improvement": "Brief improvement suggestion"
}}
"""
    
    try:
        result = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(result.text)
    except Exception as e:
        return {
            "score": 0,
            "max_points": question.get('max_points', 10),
            "feedback_positive": "Unable to evaluate",
            "feedback_improvement": str(e)
        }


def generate_interview_report(
    model: genai.GenerativeModel,
    questions: List[dict],
    evaluations: List[dict],
    candidate_profile: Optional[dict] = None,
    fit_analysis: Optional[dict] = None
) -> dict:
    """Generate comprehensive interview report combining resume and interview data."""
    
    # Build Q&A summary
    qa_summary = []
    total_score = 0
    max_total = 0
    
    for i, (q, e) in enumerate(zip(questions, evaluations)):
        qa_summary.append({
            "question": q.get('question_text', ''),
            "topic": q.get('title', ''),
            "difficulty": q.get('difficulty', 'Medium'),
            "response": e.get('response', 'No response'),
            "score": e.get('score', 0),
            "max_points": e.get('max_points', 10),
            "feedback_positive": e.get('feedback_positive', ''),
            "feedback_improvement": e.get('feedback_improvement', '')
        })
        total_score += e.get('score', 0)
        max_total += e.get('max_points', 10)
    
    profile_info = ""
    if candidate_profile:
        profile_info = f"""
CANDIDATE PROFILE (from Resume):
- Current Role: {candidate_profile.get('current_role', 'Unknown')}
- Experience: {candidate_profile.get('experience_years', 0)} years
- Education: {candidate_profile.get('educational_level', 'Unknown')}
"""
    
    # Include resume-based analysis if available
    resume_analysis = ""
    if fit_analysis:
        resume_strengths = fit_analysis.get('strengths', [])
        resume_weaknesses = fit_analysis.get('weaknesses', [])
        resume_analysis = f"""
RESUME ANALYSIS (Pre-Interview):
Fit Score: {fit_analysis.get('fit_score', 'N/A')}%

Resume Strengths:
{chr(10).join(['- ' + s for s in resume_strengths[:3]])}

Resume Gaps:
{chr(10).join(['- ' + w for w in resume_weaknesses[:3]])}
"""
    
    prompt = f"""
You are a Senior HR Manager writing a comprehensive interview evaluation report.

Your task is to synthesize insights from TWO sources:
1. **Resume Analysis**: What we learned about the candidate BEFORE the interview
2. **Interview Performance**: How the candidate actually performed during the interview

{profile_info}

{resume_analysis}

INTERVIEW PERFORMANCE:
Total Score: {total_score}/{max_total} ({round(total_score/max_total*100 if max_total > 0 else 0)}%)

QUESTION-BY-QUESTION BREAKDOWN:
{json.dumps(qa_summary, indent=2)}

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY 3 "Points Forts" (Strengths) - combine evidence from both resume AND interview
2. Generate EXACTLY 3 "Axes d'amélioration" (Areas for Improvement) - based on interview gaps AND resume weaknesses
3. Each point should be 1-2 sentences, specific and actionable
4. If interview data is limited, lean more on resume analysis
5. Write in a professional, encouraging tone

FORMAT RULES:
- Each strength should follow: "Skill/Quality: Brief explanation with evidence"
- Each weakness should follow: "Area: Specific improvement suggestion"
- DO NOT use markdown formatting (no **, no *, no #)

OUTPUT (JSON only):
{{
    "overall_score": {total_score},
    "max_score": {max_total},
    "percentage": {round(total_score/max_total*100 if max_total > 0 else 0)},
    "overall_assessment": "2-3 sentence summary combining resume fit and interview performance",
    "strengths": [
        "First Strength: Evidence from resume and/or interview performance",
        "Second Strength: Evidence from resume and/or interview performance",
        "Third Strength: Evidence from resume and/or interview performance"
    ],
    "weaknesses": [
        "First Area: Specific improvement suggestion based on gaps identified",
        "Second Area: Specific improvement suggestion based on gaps identified",
        "Third Area: Specific improvement suggestion based on gaps identified"
    ],
    "recommendations": [
        "Actionable recommendation 1",
        "Actionable recommendation 2",
        "Actionable recommendation 3"
    ],
    "hiring_recommendation": "Hire/Strong Hire/Maybe/No Hire",
    "hiring_rationale": "Brief explanation combining resume fit and interview evidence"
}}
"""
    
    try:
        result = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(result.text)
    except Exception as e:
        # Fallback: Use available data to generate basic report
        fallback_strengths = []
        fallback_weaknesses = []
        
        # Pull from fit_analysis if available
        if fit_analysis:
            fallback_strengths = fit_analysis.get('strengths', [])[:3]
            fallback_weaknesses = fit_analysis.get('weaknesses', [])[:3]
        
        # Pull from evaluations if fit_analysis is empty
        if not fallback_strengths:
            fallback_strengths = [e.get('feedback_positive', 'Good effort') for e in evaluations[:3] if e.get('feedback_positive')]
        if not fallback_weaknesses:
            fallback_weaknesses = [e.get('feedback_improvement', 'Continue practicing') for e in evaluations[:3] if e.get('feedback_improvement')]
        
        # Ensure exactly 3
        while len(fallback_strengths) < 3:
            fallback_strengths.append("Interview completed successfully")
        while len(fallback_weaknesses) < 3:
            fallback_weaknesses.append("Continue practicing interview skills")
        
        return {
            "overall_score": total_score,
            "max_score": max_total,
            "percentage": round(total_score/max_total*100 if max_total > 0 else 0),
            "overall_assessment": "Interview completed. Please review responses for detailed feedback.",
            "strengths": fallback_strengths[:3],
            "weaknesses": fallback_weaknesses[:3],
            "recommendations": ["Review technical fundamentals", "Practice behavioral questions", "Work on communication clarity"],
            "hiring_recommendation": "Review Required",
            "hiring_rationale": f"Error generating detailed report: {e}"
        }


# --- AI CHAIN FUNCTIONS ---

async def run_candidate_profile_extraction(
    model: genai.GenerativeModel,
    resume_text: str
) -> Optional[dict]:
    """Extract candidate profile information from resume."""
    
    prompt = f"""
You are an expert HR Resume Parser.

RESUME:
{resume_text}

TASK:
Extract the following information from the resume:

1. **Current Role**: The candidate's most recent or current job title. If not explicitly stated, infer from the most recent position.

2. **Location**: The candidate's location (city, state/country). Look for addresses, contact info, or location mentions.

3. **Educational Level**: The highest education level (e.g., "High School", "Bachelor's Degree", "Master's Degree", "PhD", "Associate Degree"). Include the field of study if available.

4. **Experience**: Calculate the TOTAL years of professional experience by:
   - Finding all job positions with date ranges (e.g., "2018-2020", "Jan 2019 - Dec 2021", "2020-Present")
   - For "Present" or "Current", use 2026 as the end year
   - Calculate the duration of each position
   - SUM all durations to get total years
   - Don't use any decimal places

OUTPUT (JSON only, no markdown):
{{
    "current_role": "Job Title",
    "location": "City, Country",
    "educational_level": "Degree (Field if available)",
    "experience_years": 5,
    "experience_breakdown": "Brief breakdown of how years were calculated"
}}
"""
    
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Profile extraction failed: {e}")
        return None

async def run_context_analysis(
    model: genai.GenerativeModel,
    resume_text: str,
    interview_type: str = "technical"
) -> Optional[dict]:
    """Phase 1: Analyze resume and generate context."""
    
    prompt = f"""
You are a Senior HR Analyst with expertise in {interview_type} recruiting.

INPUTS:
- RESUME: {resume_text}
- INTERVIEW TYPE: {interview_type} (Focus explicitly on this type)
- JD TEMPLATE: {JD_TEMPLATE}

TASK:
1. Analyze the candidate's persona based on their resume.
2. Generate a generalized job description that matches their profile.
3. Create a campaign context summarizing the interview focus areas.
4. **Context Rule**:
   - If Type is 'Technical', focus on hard skills, coding, and system design.
   - If Type is 'Abstract Knowledge', focus on behavioral questions, situational judgment, soft skills, and leadership.

OUTPUT (JSON only, no markdown):
{{
    "campaign_context": "Brief summary of interview focus areas...",
    "job_description": "Full markdown-formatted job description..."
}}
"""
    
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Context analysis failed: {e}")
        return None

async def run_question_generation(
    model: genai.GenerativeModel,
    context_data: dict,
    interview_type: str = "technical"
) -> list[dict]:
    """Phase 2: Generate interview questions."""
    
    prompt = f"""
You are an Expert Interviewer focusing on {interview_type} skills.
Your goal is to create interview questions based on the core competencies required.

INPUT CONTEXT:
{context_data.get('campaign_context', '')}
{context_data.get('job_description', '')}

INSTRUCTIONS:
1. Generate exactly {MAX_QUESTIONS} interview questions.
2. **INTERVIEW TYPE FOCUS**:
   - **Technical**: Coding problems, architecture, specific frameworks, debugging.
   - **Abstract Knowledge**: Behavioral (STAR method), leadership, conflict resolution, situational logic.
3. Include a mix of "Easy", "Medium", and "Hard".
4. SCORING RULES:
   - Hard questions: 10-15 points
   - Medium questions: 7-10 points
   - Easy questions: 3-7 points
   - **CRITICAL: The total of all max_points MUST equal exactly 100.**

OUTPUT FORMAT (JSON only):
{{
    "questions": [
        {{
            "id": 1,
            "title": "Topic Name",
            "question_text": "The actual interview question to ask",
            "difficulty": "Easy",
            "max_points": 5,
            "scoring_criteria": "What to look for in a good answer"
        }}
    ]
}}
"""
    
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(response.text)
        return data.get("questions", [])
    except Exception as e:
        print(f"Question generation failed: {e}")
        return []

import asyncio

async def run_agentic_chain(
    resume_text: str,
    api_key: str,
    interview_type: str = "technical"
) -> Tuple[Optional[dict], Optional[dict], list[dict]]:
    """Execute the full agentic interview generation chain.
    """
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL_NAME)
    except Exception as e:
        print(f"Failed to initialize Gemini: {e}")
        return None, None, []
    
    # Run Profile Extraction and Context Analysis in parallel
    candidate_profile_task = run_candidate_profile_extraction(model, resume_text)
    context_data_task = run_context_analysis(model, resume_text, interview_type)
    
    candidate_profile, context_data = await asyncio.gather(candidate_profile_task, context_data_task)
    
    if not context_data:
        return candidate_profile, None, []
    
    # Phase 3: Question Generation (Must wait for Context)
    questions = await run_question_generation(model, context_data, interview_type)
    
    return candidate_profile, context_data, questions


# --- NEW: JD-BASED FLOW ---

async def analyze_candidate_fit(
    model: genai.GenerativeModel,
    resume_text: str,
    job_description: str
) -> Optional[dict]:
    """Analyze how well the candidate's resume matches the job description."""
    
    prompt = f"""
You are an expert HR Analyst specializing in candidate-job fit assessment.

JOB DESCRIPTION:
{job_description}

CANDIDATE'S RESUME:
{resume_text}

TASK:
Analyze how well this candidate matches the job requirements.

IMPORTANT FORMATTING RULES:
- Do NOT use markdown formatting (no **, no *, no #)
- Each strength/weakness should be in format: "Short Title: Detailed explanation"
- Keep titles under 5 words
- Explanations should be 1-2 sentences
OUTPUT (JSON only):
{{
    "strengths": [
        "AI Experience: Candidate has 3+ years developing ML models with TensorFlow and PyTorch.",
        "Leadership Skills: Led a team of 5 engineers and delivered project 2 weeks early.",
        "Technical Depth: Strong backend experience with Python, FastAPI, and PostgreSQL."
    ],
    "weaknesses": [
        "No WebRTC Experience: Resume does not mention real-time streaming technologies required for this role.",
        "Limited Cloud Skills: No evidence of Kubernetes or AWS experience listed in requirements.",
        "Missing Security Focus: No mention of GDPR or data privacy implementation."
    ],
    "fit_score": 75,
    "summary": "Brief overall assessment of candidate fit for this role."
}}
"""
    
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Fit analysis failed: {e}")
        return None


async def generate_questions_from_jd(
    model: genai.GenerativeModel,
    job_description: str,
    interview_type: str = "technical",
    question_count: int = 5
) -> list[dict]:
    """Generate interview questions based on job description requirements."""
    
    prompt = f"""
You are an Expert Interviewer creating questions to assess candidates for this role.

JOB DESCRIPTION:
{job_description}
INTERVIEW TYPE: {interview_type}

INSTRUCTIONS:
1. Generate exactly {question_count} interview questions based on the criteria below.
2. **INTERVIEW TYPE FOCUS**:
   - **Technical**: Focus STRICTLY on Data Structures and Algorithms (Simple to Medium). Do NOT ask about specific frameworks or system design unless explicitly required by the user context. Focus on problem-solving logic.
   - **Abstract Knowledge** (Behavioral): Focus STRICTLY on behavioral questions (STAR method), culture fit, soft skills, and situational judgment. NO technical coding questions.
   - **Mixed**: A balanced mix of technical and behavioral.
3. Include a mix of "Easy", "Medium", and "Hard".
4. SCORING RULES:
   - Hard questions: 10-15 points
   - Medium questions: 7-10 points
   - Easy questions: 3-7 points
   - **CRITICAL: The total of all max_points MUST equal exactly 100.**

OUTPUT FORMAT (JSON only):
{{
    "questions": [
        {{
            "id": 1,
            "title": "Topic from JD",
            "question_text": "The actual interview question to ask",
            "difficulty": "Easy",
            "max_points": 5,
            "scoring_criteria": "What to look for in a good answer"
        }}
    ]
}}
"""
    
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(response.text)
        return data.get("questions", [])
    except Exception as e:
        print(f"Question generation from JD failed: {e}")
        return []


async def run_agentic_chain_with_jd(
    resume_text: str,
    job_description: str,
    api_key: str,
    interview_type: str = "technical",
    question_count: int = 5
) -> Tuple[Optional[dict], Optional[dict], list[dict]]:
    """Execute the agentic chain using job description as the source for questions."""
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL_NAME)
    except Exception as e:
        print(f"Failed to initialize Gemini: {e}")
        return None, None, []
    
    # Run all analyses in parallel
    profile_task = run_candidate_profile_extraction(model, resume_text)
    fit_task = analyze_candidate_fit(model, resume_text, job_description)
    questions_task = generate_questions_from_jd(model, job_description, interview_type, question_count)
    
    candidate_profile, fit_analysis, questions = await asyncio.gather(
        profile_task, fit_task, questions_task
    )
    
    return candidate_profile, fit_analysis, questions


# --- REPORT QUERY (Ask AI Assistant) ---

async def query_report(
    report_data: dict,
    user_question: str,
    api_key: str
) -> Optional[dict]:
    """Analyze a report and answer specific questions."""
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL_NAME)
    except Exception as e:
        print(f"Failed to initialize Gemini: {e}")
        return None
    
    # Build report text from structured data
    report_text = f"""
INTERVIEW REPORT SUMMARY:
- Overall Score: {report_data.get('percentage', 0)}%
- Total Points: {report_data.get('overall_score', 0)}/{report_data.get('max_score', 100)}
- Hiring Recommendation: {report_data.get('hiring_recommendation', 'N/A')}

OVERALL ASSESSMENT:
{report_data.get('overall_assessment', 'No assessment available.')}

STRENGTHS:
{chr(10).join(['- ' + s for s in report_data.get('strengths', [])])}

AREAS FOR IMPROVEMENT:
{chr(10).join(['- ' + w for w in report_data.get('weaknesses', [])])}

RECOMMENDATIONS:
{chr(10).join(['- ' + r for r in report_data.get('recommendations', [])])}

HIRING RATIONALE:
{report_data.get('hiring_rationale', 'No rationale provided.')}
"""

    prompt = f"""
You are an Expert Report Analyst. Your goal is to answer questions based strictly on the provided report.

REPORT CONTENT:
{report_text}

USER QUESTION:
{user_question}

INSTRUCTIONS:
1. Extract relevant data points and quotes from the report.
2. Synthesize an answer that directly addresses the user question.
3. The answer should be relevant, interesting and reveal a true insight about the report.
4. Identify the "Confidence Level" of your answer (Low, Medium, High).
5. Provide a "Source Trace" listing which sections of the report were used.

OUTPUT FORMAT (JSON only):
{{
    "answer": "The detailed response",
}}
"""

    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Report query failed: {e}")
        return {
            "answer": "I was unable to analyze the report at this time. Please try again.",
        }


# --- AI COACH RECOMMENDATIONS (2-Step Analysis) ---

async def generate_ai_recommendations(
    candidate_transcript: str,
    source_report: dict,
    api_key: str
) -> dict:
    """
    Generate deep-dive AI recommendations using a 2-step analysis:
    Step 1: Analyze gaps between candidate response and source report
    Step 2: Generate actionable recommendations based on gaps
    """
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL_NAME)
    except Exception as e:
        print(f"Failed to initialize Gemini: {e}")
        return None
    
    # Build source report text
    source_report_text = f"""
REPORT SUMMARY:
- Fit Score: {source_report.get('fit_score', 'N/A')}%
- Strengths: {', '.join(source_report.get('strengths', [])[:3])}
- Weaknesses: {', '.join(source_report.get('weaknesses', [])[:3])}
- Technical Areas: {source_report.get('summary', 'No summary available')}
"""
    
    # === STEP 1: Analyze Gaps ===
    prompt_step1 = f"""
Analyze the candidate's response against the source report.

CANDIDATE TRANSCRIPT:
{candidate_transcript}

SOURCE REPORT:
{source_report_text}

INSTRUCTIONS:
1. List all technical terms mentioned in the report that the candidate OMITTED.
2. Identify specific "generic" phrases used by the candidate (e.g., "very efficient," "highly scalable") that lack data-backed evidence.
3. Provide the results in a structured format.

OUTPUT FORMAT (JSON only):
{{
    "omitted_technical_concepts": ["concept1", "concept2", "concept3"],
    "generic_phrases_detected": ["phrase1", "phrase2"],
    "missing_data_points": ["datapoint1", "datapoint2"]
}}
"""
    
    try:
        # Step 1: Get gaps analysis
        step1_response = await model.generate_content_async(
            prompt_step1,
            generation_config={"response_mime_type": "application/json"}
        )
        gaps_analysis = json.loads(step1_response.text)
        
        # === STEP 2: Generate Recommendations ===
        prompt_step2 = f"""
Using the extracted gaps, generate 3 specific, deep-dive recommendations for the AI Coach sidebar.

GAPS ANALYSIS:
- Omitted Technical Concepts: {', '.join(gaps_analysis.get('omitted_technical_concepts', []))}
- Generic Phrases Detected: {', '.join(gaps_analysis.get('generic_phrases_detected', []))}
- Missing Data Points: {', '.join(gaps_analysis.get('missing_data_points', []))}

ORIGINAL REPORT CONTEXT:
{source_report_text}

INSTRUCTIONS:
1. For every "generic phrase" identified, provide a technical replacement using concepts from the report.
2. Formulate "Technical Depth" advice that requires the candidate to explain the LOGIC, not just state the result.
3. Ensure the advice is pragmatically useful and actionable.
4. Generate exactly 3 recommendations in three categories: Technical Depth, Communication Style, Speaking Pace.

OUTPUT FORMAT (JSON only):
{{
    "recommendations": [
        {{
            "category": "Technical Depth",
            "content": "Specific actionable advice about technical concepts to mention and how to explain them with logic"
        }},
        {{
            "category": "Communication Style", 
            "content": "Specific advice about replacing generic phrases with data-backed statements"
        }}
    ],
    "confidence_score": 85,
    "gaps_summary": "Brief summary of most critical gaps identified"
}}
"""
        
        step2_response = await model.generate_content_async(
            prompt_step2,
            generation_config={"response_mime_type": "application/json"}
        )
        recommendations = json.loads(step2_response.text)
        
        # Combine both analyses
        return {
            "gaps_analysis": gaps_analysis,
            "recommendations": recommendations.get("recommendations", []),
            "confidence_score": recommendations.get("confidence_score", 80),
            "gaps_summary": recommendations.get("gaps_summary", "")
        }
        
    except Exception as e:
        print(f"AI Recommendations failed: {e}")
        # Return fallback recommendations
        return {
            "gaps_analysis": {
                "omitted_technical_concepts": [],
                "generic_phrases_detected": [],
                "missing_data_points": []
            },
            "recommendations": [
                {
                    "category": "Technical Depth",
                    "content": "Focus on articulating your approach, explain the logic, and provide concrete solutions."
                },
                {
                    "category": "Communication Style",
                    "content": "Your communication is clear. Ensure you maintain this structure."
                },
                {
                    "category": "Speaking Pace",
                    "content": "Maintain a steady 130-150 wpm pace. Pause for emphasis on key technical terms."
                }
            ],
            "confidence_score": 75,
            "gaps_summary": "Analysis completed with limited data."
        }