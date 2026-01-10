from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import backend.services as services
import backend.db
import google.generativeai as genai

from pathlib import Path

# Load environment variables from the root directory
root_dir = Path(__file__).resolve().parent.parent
load_dotenv(root_dir / ".env")

app = FastAPI(title="Agentic Interviewer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production (or specify your Vercel domain)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---

class Question(BaseModel):
    id: int
    title: str
    question_text: str
    difficulty: str
    max_points: int
    scoring_criteria: str

class EvaluationRequest(BaseModel):
    session_id: Optional[str] = None
    session_name: Optional[str] = None
    user_id: Optional[str] = None  # Added for user isolation
    question: Question
    response_text: str
    code_submission: Optional[str] = None  # Code from the editor for technical questions

class QuestionEvaluation(BaseModel):
    question_text: str
    title: str
    difficulty: str
    response: str
    score: int
    max_points: int
    feedback_positive: str
    feedback_improvement: str

class ReportRequest(BaseModel):
    questions: List[Question]
    evaluations: List[QuestionEvaluation]
    candidate_profile: Optional[dict] = None
    fit_analysis: Optional[dict] = None  # Resume analysis for combined insights

# --- Routes ---

@app.get("/")
def read_root():
    return {"message": "Agentic Interviewer API is running"}

@app.get("/api/check-db")
def check_db():
    """Debug endpoint to check DB connection and permissions"""
    status = {
        "supabase_initialized": backend.db.supabase is not None,
        "env_url_present": bool(os.environ.get("NEXT_PUBLIC_SUPABASE_URL")),
        "env_key_present": bool(os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
        "write_test": "pending"
    }
    
    if backend.db.supabase:
        try:
            test_data = {
                "session_id": "debug-session",
                "question_id": "debug-q",
                "question_text": "Debug",
                "response_text": "Debug",
                "evaluation": {},
                "user_id": "debug-user"
            }
            backend.db.supabase.table("interview_responses").insert(test_data).execute()
            status["write_test"] = "success"
        except Exception as e:
            status["write_test"] = f"failed: {str(e)}"
            
    return status

@app.post("/api/analyze-resume")
async def analyze_resume(
    file: UploadFile = File(...),
    interview_type: str = Form("technical"),
    job_description: str = Form(...),  # Now required - JD drives the interview
    question_count: int = Form(5)
):
    """Analyze uploaded resume PDF against job description and generate interview contents."""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    if not job_description or len(job_description.strip()) < 50:
        raise HTTPException(status_code=400, detail="Please provide a detailed job description (at least 50 characters)")
    
    try:
        content = await file.read()
        resume_text = services.extract_pdf_text(content)
        
        if not resume_text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Run the agentic chain with job description
        profile, fit_analysis, questions = await services.run_agentic_chain_with_jd(
            resume_text, job_description, api_key, interview_type, question_count
        )
        
        if not fit_analysis or not questions:
            raise HTTPException(status_code=500, detail="Failed to generate interview content")
            
        return {
            "profile": profile,
            "fit_analysis": fit_analysis,  # New: strengths, weaknesses, fit_score
            "questions": questions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate-response")
async def evaluate_response(request: EvaluationRequest):
    """Evaluate a single user response."""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(services.MODEL_NAME)
        
        # DEBUG LOGGING
        print(f"DEBUG EVAL: SessionID={request.session_id}, UserID={request.user_id}, HasDB={backend.db.supabase is not None}", flush=True)

        # Convert Pydantic model to dict for the service function
        question_dict = request.question.model_dump()
        
        evaluation = services.evaluate_single_response(model, question_dict, request.response_text)

        # Store in Supabase if configured
        if backend.db.supabase and request.session_id:
            print(f"Attempting to save response for session {request.session_id}...", flush=True)
            try:
                data = {
                    "session_id": request.session_id,
                    "question_id": str(request.question.id),
                    "question_text": request.question.question_text,
                    "response_text": request.response_text,
                    "evaluation": evaluation,
                }
                if request.session_name:
                    data["session_name"] = request.session_name
                if request.user_id:
                    data["user_id"] = request.user_id
                
                print(f"Saving data: {data}")
                
                # Perform the insert
                result = backend.db.supabase.table("interview_responses").insert(data).execute()
                print(f"Save successful. Result: {result}")

            except Exception as e:
                print(f"CRITICAL SUPABASE ERROR: {e}")
                # Continue without failing the request
        else:
            print("Skipping save: Supabase not configured or missing session_id")

        return evaluation
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-report")
async def generate_report(request: ReportRequest):
    """Generate final interview report."""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(services.MODEL_NAME)
        
        # Convert models to dicts
        questions_dicts = [q.model_dump() for q in request.questions]
        evaluations_dicts = [e.model_dump() for e in request.evaluations]
        
        report = services.generate_interview_report(
            model, 
            questions_dicts, 
            evaluations_dicts, 
            request.candidate_profile,
            request.fit_analysis
        )
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from livekit import api as livekit_api

class TokenRequest(BaseModel):
    room_name: str
    participant_name: str

@app.post("/api/get-token")
async def get_token(request: TokenRequest):
    """Generate LiveKit access token."""
    
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not api_key or not api_secret:
        raise HTTPException(status_code=500, detail="LiveKit credentials not configured")
        
    try:
        token = livekit_api.AccessToken(api_key, api_secret)
        token.with_identity(request.participant_name)
        token.with_name(request.participant_name)
        token.with_grants(livekit_api.VideoGrants(
            room_join=True,
            room=request.room_name,
            can_publish=True,
            can_subscribe=True
        ))
        
        return {"token": token.to_jwt()}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Session Analysis Endpoints ---

class SessionAnalysisRequest(BaseModel):
    session_id: str
    fit_analysis: dict
    questions: Optional[List[dict]] = None
    session_name: Optional[str] = None
    user_id: Optional[str] = None

@app.post("/api/save-session-analysis")
async def save_session_analysis(request: SessionAnalysisRequest):
    """Save the CV fit analysis for a session."""
    
    if not backend.db.supabase:
        return {"status": "skipped", "message": "Database not configured"}
    
    try:
        data = {
            "session_id": request.session_id,
            "fit_analysis": request.fit_analysis,
            "session_name": request.session_name,
        }
        if request.user_id:
            data["user_id"] = request.user_id
        if request.questions:
            data["questions"] = request.questions
            
        # Upsert - update if exists, insert if not
        backend.db.supabase.table("session_analyses").upsert(
            data, 
            on_conflict="session_id"
        ).execute()
        
        return {"status": "success"}
    except Exception as e:
        print(f"Error saving session analysis: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/api/session-analysis/{session_id}")
async def get_session_analysis(session_id: str, user_id: Optional[str] = None):
    """Retrieve the CV fit analysis for a session."""
    
    if not backend.db.supabase:
        return None
    
    try:
        query = backend.db.supabase.table("session_analyses").select("*").eq("session_id", session_id)
        
        # Filter by user_id if provided for security
        if user_id:
            query = query.eq("user_id", user_id)
            
        result = query.single().execute()
        
        if result.data:
            return result.data
        return None
    except Exception as e:
        print(f"Error fetching session analysis: {e}")
        return None


# --- Dashboard Endpoints ---

@app.get("/api/dashboard-stats")
async def get_dashboard_stats(user_id: Optional[str] = None):
    """Fetch aggregated dashboard statistics from real interview history."""
    
    if not backend.db.supabase:
        return {
            "recent_interviews": [],
            "performance_data": [],
            "recommendations": []
        }

    try:
        # Fetch interview responses - FILTER BY USER_ID for data isolation
        query = backend.db.supabase.table("interview_responses").select("*")
        
        # Filter by user_id if provided, but also include records without user_id (backwards compatibility)
        if user_id:
            query = query.or_(f"user_id.eq.{user_id},user_id.is.null")
        
        result = query.order("created_at", desc=True).execute()
        rows = result.data if result.data else []
        
        if not rows:
            return {
                "recent_interviews": [],
                "performance_data": [],
                "recommendations": []
            }

        # Group by session_id
        session_map = {}
        for row in rows:
            sid = row.get("session_id", "unknown")
            if sid not in session_map:
                session_map[sid] = []
            session_map[sid].append(row)

        # Build recent interviews (latest 5 sessions)
        recent = []
        for session_id, responses in list(session_map.items())[:5]:
            total_score = 0
            max_score = 0
            
            for r in responses:
                ev = r.get("evaluation")
                if isinstance(ev, dict):
                    total_score += ev.get("score", 0)
                    max_score += ev.get("max_points", 10)
            
            # Get session name from first response or generate one
            session_name = responses[0].get("session_name") if responses else None
            if not session_name:
                session_name = "Interview Session"
            
            # Calculate percentage score (0-100)
            percentage = round((total_score / max_score * 100) if max_score > 0 else 0)
            
            # Format date
            created_at = responses[0].get("created_at", "") if responses else ""
            date_str = ""
            if created_at:
                try:
                    from datetime import datetime
                    dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    date_str = dt.strftime("%b %d, %Y")
                except:
                    date_str = created_at[:10] if len(created_at) >= 10 else created_at
            
            recent.append({
                "id": session_id,
                "role": session_name,
                "score": percentage,
                "date": date_str,
                "raw_date": created_at
            })

        # Build performance data (scores over time)
        performance = []
        for i, (session_id, responses) in enumerate(list(session_map.items())[:7]):
            total_score = 0
            max_score = 0
            for r in responses:
                ev = r.get("evaluation")
                if isinstance(ev, dict):
                    total_score += ev.get("score", 0)
                    max_score += ev.get("max_points", 10)
            
            percentage = round((total_score / max_score * 100) if max_score > 0 else 0)
            created_at = responses[0].get("created_at", "") if responses else ""
            
            # Get day label
            day_label = f"Day {i+1}"
            if created_at:
                try:
                    from datetime import datetime
                    dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    day_label = dt.strftime("%a")
                except:
                    pass
            
            performance.append({
                "name": day_label,
                "score": percentage,
                "date": created_at[:10] if len(created_at) >= 10 else created_at
            })
        
        # Reverse to show oldest to newest (left to right on chart)
        performance.reverse()

        # Build recommendations from weak areas
        hard_skill_gaps = []
        soft_skill_tips = []
        
        for row in rows:
            ev = row.get('evaluation')
            if not isinstance(ev, dict):
                continue
                
            score = ev.get('score', 0)
            max_pts = ev.get('max_points', 10)
            q_text = row.get('question_text', '').lower()
            feedback = ev.get('feedback_improvement', '')
            
            # Identify weak spots (Score < 75% of max)
            if max_pts > 0 and (score / max_pts * 100) < 75:
                is_soft = any(k in q_text for k in ['behavioral', 'introduction', 'tell me about', 'colleague', 'conflict', 'soft skill'])
                
                if is_soft:
                    if feedback and len(feedback) < 150:
                        soft_skill_tips.append(feedback)
                else:
                    if feedback:
                        tip = feedback.split('.')[0] + "."
                        hard_skill_gaps.append(tip)

        recommendations = []
        
        # Technical Depth
        if hard_skill_gaps:
            unique_hard = list(set(hard_skill_gaps))[:1]
            for tip in unique_hard:
                recommendations.append({
                    "category": "Technical Depth",
                    "content": f"Focus on: {tip}" 
                })
        else:
            recommendations.append({
                "category": "Technical Depth",
                "content": "Great technical accuracy! Continue exploring advanced patterns."
            })

        # Communication Style
        if soft_skill_tips:
            unique_soft = list(set(soft_skill_tips))[:1]
            for tip in unique_soft:
                recommendations.append({
                    "category": "Communication Style",
                    "content": tip
                })
        else:
            recommendations.append({
                "category": "Communication Style",
                "content": "Your communication is clear. Ensure you maintain this structure."
            })

        # Speaking Pace
        recommendations.append({
            "category": "Speaking Pace",
            "content": "Maintain a steady 130-150 wpm pace. Pause for emphasis on key technical terms."
        })

        return {
            "recent_interviews": recent,
            "performance_data": performance,
            "recommendations": recommendations
        }
        
    except Exception as e:
        print(f"Stats Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "recent_interviews": [],
            "performance_data": [],
            "recommendations": []
        }

# --- D-ID Endpoints ---

class DIDTalkRequest(BaseModel):
    text: str
    source_url: Optional[str] = None
    voice_id: str = "en-US-JennyNeural"

@app.post("/api/did/create-talk")
async def create_did_talk(request: DIDTalkRequest):
    """Create a D-ID talking avatar video."""
    import backend.did as did
    
    try:
        result = await did.create_and_wait_for_talk(
            text=request.text,
            source_url=request.source_url,
            voice_id=request.voice_id
        )
        return {
            "id": result.get("id"),
            "status": result.get("status"),
            "result_url": result.get("result_url")
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=408, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/did/talk/{talk_id}")
async def get_did_talk(talk_id: str):
    """Get the status and result of a D-ID talk."""
    import backend.did as did
    
    try:
        result = await did.get_talk(talk_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Report Query Endpoint (Ask AI Assistant) ---

class ReportQueryRequest(BaseModel):
    report_data: dict
    user_question: str

@app.post("/api/query-report")
async def query_report(request: ReportQueryRequest):
    """Query a report with a user's question and get AI-powered answer."""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    
    try:
        result = await services.query_report(
            report_data=request.report_data,
            user_question=request.user_question,
            api_key=api_key
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to process query")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- AI Coach Recommendations Endpoint ---

class AIRecommendationsRequest(BaseModel):
    candidate_transcript: str
    source_report: dict

@app.post("/api/ai-recommendations")
async def get_ai_recommendations(request: AIRecommendationsRequest):
    """Generate deep-dive AI recommendations using 2-step gap analysis."""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    
    try:
        result = await services.generate_ai_recommendations(
            candidate_transcript=request.candidate_transcript,
            source_report=request.source_report,
            api_key=api_key
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to generate recommendations")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
