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
    candidate_profile: Optional[dict] = None
) -> dict:
    """Generate comprehensive interview report with Gemini."""
    
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
CANDIDATE PROFILE:
- Current Role: {candidate_profile.get('current_role', 'Unknown')}
- Experience: {candidate_profile.get('experience_years', 0)} years
- Education: {candidate_profile.get('educational_level', 'Unknown')}
"""
    
    prompt = f"""
You are a Senior HR Manager writing a comprehensive interview evaluation report.

{profile_info}

INTERVIEW SUMMARY:
Total Score: {total_score}/{max_total} ({round(total_score/max_total*100 if max_total > 0 else 0)}%)

QUESTION-BY-QUESTION BREAKDOWN:
{json.dumps(qa_summary, indent=2)}

TASK:
Generate a comprehensive interview report with:
1. Overall assessment (2-3 sentences)
2. 3-5 key strengths demonstrated
3. 3-5 areas for improvement
4. 3-5 specific recommendations for the candidate
5. Hiring recommendation (Strong Hire, Hire, Maybe, No Hire)

OUTPUT (JSON only):
{{
    "overall_score": {total_score},
    "max_score": {max_total},
    "percentage": 75,
    "overall_assessment": "Brief overall assessment of the candidate's performance",
    "strengths": [
        "Strength 1 with specific example",
        "Strength 2 with specific example",
        "Strength 3 with specific example"
    ],
    "weaknesses": [
        "Weakness 1 with context",
        "Weakness 2 with context",
        "Weakness 3 with context"
    ],
    "recommendations": [
        "Specific actionable recommendation 1",
        "Specific actionable recommendation 2",
        "Specific actionable recommendation 3"
    ],
    "hiring_recommendation": "Hire",
    "hiring_rationale": "Brief explanation for the hiring recommendation"
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
            "overall_score": total_score,
            "max_score": max_total,
            "percentage": round(total_score/max_total*100 if max_total > 0 else 0),
            "overall_assessment": "Unable to generate detailed assessment.",
            "strengths": ["Interview completed"],
            "weaknesses": ["Unable to analyze in detail"],
            "recommendations": ["Please review responses manually"],
            "hiring_recommendation": "Review Required",
            "hiring_rationale": f"Error generating report: {e}"
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

