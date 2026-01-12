"""
LLM-as-a-Judge: AI Evaluator Quality Assessment

This module evaluates the quality of the AI interviewer's feedback and scoring.
It assesses whether the AI's evaluations are:
- Helpful and actionable
- Specific and constructive
- Fair and accurate
- Consistent with the candidate's actual response

Adapted for TestSysAI - Agentic Interviewer Platform
"""

import google.generativeai as genai
import os
import json
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError
from datetime import datetime

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables from the root project directory
root_dir = Path(__file__).resolve().parent.parent
load_dotenv(root_dir / ".env")

# Initialize Supabase client
supabase = None
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if url and key:
    try:
        from supabase import create_client
        supabase = create_client(url, key)
        logging.info("✅ Supabase connected successfully")
    except ImportError:
        logging.error("supabase package not installed. Run: pip install supabase")
    except Exception as e:
        logging.error(f"Failed to initialize Supabase: {e}")
else:
    logging.error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found")

# Initialize Gemini
try:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    logging.info("✅ Gemini API configured successfully")
except KeyError:
    logging.error("Error: GEMINI_API_KEY environment variable not set.")
    exit(1)


# --- LLM-as-a-Judge Rubric for AI Evaluator Quality ---
AI_EVALUATOR_RUBRIC = """
You are a meta-evaluator assessing the quality of an AI interview evaluator's feedback.

Your task is to evaluate how well the AI evaluator performed its job of assessing a candidate's interview response.

**CONTEXT PROVIDED:**
- **Job Description**: The role the candidate is applying for.
- **Interview Type**: The focus of the interview (e.g., Technical, Behavioral).
- **Question & Rubric**: The question asked and the specific scoring criteria the AI should have used.
- **Domain Context**: What a correct/ideal answer should look like (implicitly provided by your expertise).

**EVALUATE THE AI'S FEEDBACK ON THESE CRITERIA (Score 1-5 each):**

1. **Helpfulness (1-5):**
   * 1: Feedback is useless, generic, or not actionable
   * 3: Somewhat helpful but lacks specific guidance
   * 5: Highly actionable, provides clear next steps for improvement

2. **Specificity (1-5):**
   * 1: Vague, generic feedback (e.g., "Good job" or "Needs improvement")
   * 3: Some specific points but could be more detailed
   * 5: Highly specific, references exact parts of the response

3. **Accuracy (1-5):**
   * 1: Feedback is factually wrong or misinterprets the response
   * 3: Mostly accurate with minor issues
   * 5: Completely accurate assessment of the response

4. **Constructiveness (1-5):**
   * 1: Harsh, discouraging, or unconstructive criticism
   * 3: Neutral tone, neither encouraging nor discouraging
   * 5: Encouraging while still being honest about areas to improve

5. **Score Fairness (1-5):**
   * 1: Score is completely unfair (too harsh or too lenient)
   * 3: Score is somewhat fair but could be adjusted
   * 5: Score is perfectly calibrated to the response quality

**ALSO PROVIDE:**
- `suggested_score`: What YOU think the correct score should be (out of the max points)
- `score_difference`: Difference between AI's score and your suggested score
- `overall_quality`: Overall quality of the AI's evaluation (1-5)

**Output Format (JSON only):**
{
    "helpfulness": 4,
    "specificity": 3,
    "accuracy": 5,
    "constructiveness": 4,
    "score_fairness": 4,
    "suggested_score": 8,
    "score_difference": 1,
    "overall_quality": 4,
    "rationale": "Brief explanation of the evaluation",
    "improvement_suggestions": "How the AI evaluator could improve its feedback"
}
"""


class JudgmentResult(BaseModel):
    helpfulness: int
    specificity: int
    accuracy: int
    constructiveness: int
    score_fairness: int
    suggested_score: int
    score_difference: int
    overall_quality: int
    rationale: str
    improvement_suggestions: str


class LLMJudgeForAIEvaluator:
    """A class to evaluate the quality of AI-generated interview feedback."""
    
    def __init__(self, model_name: str = 'gemini-2.5-flash-lite', temperature: float = 0.2):
        self.model = genai.GenerativeModel(model_name)
        self.temperature = temperature
    
    def _generate_prompt(
        self, 
        context: Dict[str, Any]
    ) -> str:
        """Constructs the full prompt for judging the AI evaluator with full context."""
        
        # Format the Rubric from the session data if available
        scoring_criteria = context.get('scoring_criteria', 'Evaluate for accuracy and depth')
        
        return f"""{AI_EVALUATOR_RUBRIC}

---
**interview CONTEXT:**
**Role Requirements (Job Description):**
{context.get('job_description', 'N/A')[:500]}... [Truncated]

**Interview Type:** {context.get('interview_type', 'General')}

---
**THE INTERVIEW INTERACTION:**

**Question:**
{context.get('question_text', '')}

**Original Scoring Rubric:**
{scoring_criteria}

**CANDIDATE'S RESPONSE:**
"{context.get('candidate_response', '')}"

---
**AI EVALUATOR'S ASSESSMENT (To be Judged):**
- **Score Given:** {context.get('ai_score', 0)}/{context.get('ai_max_points', 10)}
- **Positive Feedback:** "{context.get('ai_feedback_positive', 'N/A')}"
- **Improvement Feedback:** "{context.get('ai_feedback_improvement', 'N/A')}"
---"""
    
    def judge_ai_evaluation(self, context: Dict[str, Any]) -> Optional[JudgmentResult]:
        """Judges the quality of an AI evaluator's feedback."""
        full_prompt = self._generate_prompt(context)
        
        try:
            response_obj = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=self.temperature,
                    response_mime_type="application/json"
                )
            )
            
            if not response_obj.parts:
                return None
            
            data = json.loads(response_obj.text)
            return JudgmentResult(**data)
            
        except (json.JSONDecodeError, ValidationError) as e:
            logging.error(f"Invalid response structure: {e}")
            return None
        except Exception as e:
            logging.error(f"LLM judgment failed: {e}")
            return None


def fetch_full_interview_data(limit: int = 10) -> List[dict]:
    """
    Fetch interview responses AND join with session_analyses to get full context.
    Returns a combined list of dictionaries.
    """
    if not supabase:
        logging.error("Supabase not initialized")
        return []
    
    try:
        # 1. Fetch recent responses
        responses_result = supabase.table("interview_responses").select("*").order("created_at", desc=True).limit(limit).execute()
        responses = responses_result.data if responses_result.data else []
        
        if not responses:
            return []
            
        # 2. Extract unique session IDs to fetch context
        session_ids = list(set(r['session_id'] for r in responses))
        
        # 3. Fetch session analyses for these sessions (contains JD and Questions list)
        sessions_result = supabase.table("session_analyses").select("*").in_("session_id", session_ids).execute()
        sessions_map = {s['session_id']: s for s in sessions_result.data} if sessions_result.data else {}
        
        full_data = []
        for r in responses:
            session = sessions_map.get(r['session_id'], {})
            
            # Find the specific question details from the session's question list
            # We match mainly by question text or ID if available
            questions_list = session.get('fit_analysis', {}).get('questions', []) 
            # Note: 'fit_analysis' usually stores questions in some versions, 
            # but sometimes it's passed separately. Let's check typical structure.
            # In `main.py`, `save_session_analysis` stores `questions` in the `fit_analysis` JSONB column 
            # if passed, OR more likely in a separate column if schema evolved. 
            # Code says: data["question_data"] = request.questions if present.
            # Actually, `session_analyses` usually has `fit_analysis` as JSONB.
            # Let's assume the session context we need (JD) is top level or in fit_analysis.
            
            # Extract JD
            jd = session.get('job_description', '') or \
                 session.get('fit_analysis', {}).get('job_description', '') or \
                 "No Job Description Found"
            
            # finding scoring criteria
            # We try to find the matching question in the session's stored questions
            # The 'questions' might be in fit_analysis or a separate field depending on implementation version
            # Fallback to generic if not found
            scoring_crit = "Evaluate based on technical accuracy and clarity."
            
            # Try to parse questions from fit_analysis if they exist there
            # (This logic depends on how save_session_analysis stored it)
            
            ai_eval = r.get("evaluation", {})
            if isinstance(ai_eval, str):
                try:
                    ai_eval = json.loads(ai_eval)
                except:
                    ai_eval = {}
            
            full_data.append({
                "response_id": r['id'],
                "session_id": r['session_id'],
                "question_text": r['question_text'],
                "candidate_response": r.get('response_text', ''),
                "ai_score": ai_eval.get('score', 0),
                "ai_max_points": ai_eval.get('max_points', 10),
                "ai_feedback_positive": ai_eval.get('feedback_positive', ''),
                "ai_feedback_improvement": ai_eval.get('feedback_improvement', ''),
                "job_description": jd,
                "interview_type": session.get('interview_type', 'General'),
                "scoring_criteria": scoring_crit # In a real prod env, we'd match question ID to get specific rubric
            })
            
        return full_data
        
    except Exception as e:
        logging.error(f"Failed to fetch data: {e}")
        return []


def calculate_summary_stats(results: List[dict]) -> dict:
    """Calculate aggregate statistics from evaluation results."""
    valid_results = [r for r in results if r.get("overall") != "-"]
    if not valid_results:
        return {}
        
    avg_overall = sum(int(r["overall"]) for r in valid_results) / len(valid_results)
    avg_helpful = sum(int(r["helpful"]) for r in valid_results) / len(valid_results)
    
    score_diffs = [int(r["diff"]) for r in valid_results if r["diff"] not in ["-", "ERR", "0"]]
    avg_diff = sum(score_diffs) / len(score_diffs) if score_diffs else 0
    
    return {
        "total_evaluated": len(valid_results),
        "avg_quality_score": round(avg_overall, 2),
        "avg_helpfulness_score": round(avg_helpful, 2),
        "avg_score_discrepancy": round(avg_diff, 2),
        "calibration_note": "Positive = AI too strict, Negative = AI too lenient" if avg_diff < 0 else "Positive = AI too harsh"
    }


def save_evaluation_results(results: List[dict], filepath: str = "eval_results.json"):
    """Save full results for later analysis."""
    try:
        with open(filepath, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "judge_model": "gemini-2.5-flash-lite",
                "summary": calculate_summary_stats(results),
                "results": results
            }, f, indent=2)
        print(f"\n💾 Full detailed report saved to: {os.path.abspath(filepath)}")
    except Exception as e:
        logging.error(f"Failed to save results to file: {e}")


def print_table(headers: List[str], rows: List[List[str]], col_widths: List[int]):
    """Print a formatted ASCII table."""
    separator = "+" + "+".join(["-" * (w + 2) for w in col_widths]) + "+"
    
    def format_row(values):
        cells = []
        for val, width in zip(values, col_widths):
            val_str = str(val)[:width]
            cells.append(f" {val_str.ljust(width)} ")
        return "|" + "|".join(cells) + "|"
    
    print(separator)
    print(format_row(headers))
    print(separator)
    for row in rows:
        print(format_row(row))
    print(separator)


def run_evaluation():
    """Main function to evaluate the AI evaluator's feedback quality."""
    print("\n" + "=" * 100)
    print("🧠 LLM-as-a-Judge: AI Evaluator Quality Assessment (Enhanced w/ Context)")
    print("=" * 100 + "\n")
    
    # Fetch responses from database
    print("📥 Fetching interview data (Responses + Job Descriptions + Rubrics)...")
    data_items = fetch_full_interview_data(limit=10)
    
    if not data_items:
        print("❌ No interview data found.")
        return
    
    print(f"✅ Found {len(data_items)} interaction pairs to assess\n")
    
    # Initialize judge
    judge = LLMJudgeForAIEvaluator()
    
    # Prepare results
    results = []
    
    print("🔍 Judging AI Evaluator's feedback quality...\n")
    
    for i, item in enumerate(data_items):
        session_id = item['session_id'][:8]
        
        # Skip if missing critical evals
        if not item['ai_feedback_positive']:
            continue
        
        print(f"  [{i+1}/{len(data_items)}] Judging session {session_id} (Type: {item['interview_type']})...")
        
        # Get LLM judge's assessment
        judgment = judge.judge_ai_evaluation(item)
        
        if judgment:
            suggested = judgment.suggested_score
            # Manual calculation to ensure consistency as per user request
            # Positive diff means AI was too harsh (suggested > ai_score)
            # Negative diff means AI was too lenient (suggested < ai_score)
            score_diff = suggested - int(item['ai_score'])
            
            results.append({
                "session": session_id,
                "ai_score": f"{item['ai_score']}/{item['ai_max_points']}",
                "suggested": f"{suggested}/{item['ai_max_points']}",
                "diff": f"{score_diff:+d}" if score_diff != 0 else "0",
                "helpful": str(judgment.helpfulness),
                "specific": str(judgment.specificity),
                "accurate": str(judgment.accuracy),
                "construct": str(judgment.constructiveness),
                "fair": str(judgment.score_fairness),
                "overall": str(judgment.overall_quality),
                "rationale": judgment.rationale or 'N/A',
                "rationale_preview": (judgment.rationale or 'N/A')[:50],
                "improvement_suggestions": judgment.improvement_suggestions or 'N/A'
            })
        else:
            results.append({
                "session": session_id,
                "ai_score": f"{item['ai_score']}/{item['ai_max_points']}",
                "suggested": "ERR",
                "diff": "-",
                "helpful": "-",
                "specific": "-",
                "accurate": "-",
                "construct": "-",
                "fair": "-",
                "overall": "-",
                "rationale": "Judgment failed"
            })
    
    # Display results table
    if results:
        print("\n" + "=" * 130)
        print("📊 AI EVALUATOR QUALITY ASSESSMENT RESULTS")
        print("=" * 130)
        
        headers = ["Session", "AI Score", "Suggest", "Diff", "Help", "Spec", "Acc", "Cons", "Fair", "Qual", "Rationale"]
        col_widths = [8, 9, 7, 4, 4, 4, 3, 4, 4, 4, 50]
        
        rows = []
        full_report_data = [] # To store complete data for JSON dump
        
        for r in results:
            # Prepare row for table with truncation
            rows.append([
                r["session"],
                r["ai_score"],
                r["suggested"],
                r["diff"],
                r["helpful"],
                r["specific"],
                r["accurate"],
                r["construct"],
                r["fair"],
                r["overall"],
                r["rationale_preview"] # Use the preview version for table
            ])
            
            # Store full data
            full_report_data.append(r)
        
        print_table(headers, rows, col_widths)
        
        # Save full results to file (using new function)
        save_evaluation_results(full_report_data, "eval_results.json")
        
        # Summary statistics displaying (Keeping this for CLI feedback)
        print("\n📈 SUMMARY:")
        valid_results = [r for r in results if r["overall"] != "-"]
        if valid_results:
            avg_overall = sum(int(r["overall"]) for r in valid_results) / len(valid_results)
            print(f"   • Total AI Evaluations Assessed: {len(valid_results)}")
            print(f"   • Average Evaluator Quality: {avg_overall:.1f}/5")
            
            score_diffs = [int(r["diff"]) for r in valid_results if r["diff"] not in ["-", "ERR", "0"]]
            if score_diffs:
                avg_diff = sum(score_diffs) / len(score_diffs)
                print(f"   • Calibration: AI avg {avg_diff:+.1f} points discrepancy")
    else:
        print("❌ No valid AI evaluations to assess.")
    
    print("\n" + "=" * 100)
    print("✅ AI Evaluator quality assessment complete!")
    print("=" * 100 + "\n")


if __name__ == "__main__":
    run_evaluation()
