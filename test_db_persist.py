import os
import uuid
from dotenv import load_dotenv
from supabase import create_client

# Load env vars
load_dotenv()

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("❌ Error: Missing Supabase credentials in .env")
    exit(1)

print(f"Connecting to Supabase at {url}...")
try:
    supabase = create_client(url, key)
    
    # CORRECT User ID from Debug Banner
    user_id = "6a52078e-fed4-46dd-8129-d394f25d4491" 
    session_id = f"manual-fix-{uuid.uuid4()}"

    print(f"\n1. Inserting INTERVIEW RESPONSE for user: {user_id}")
    resp_data = {
        "session_id": session_id,
        "question_id": "manual-q1",
        "question_text": "Can you see this on your dashboard?",
        "response_text": f"This is a manual test for the correct user ID: {user_id}",
        "evaluation": {"score": 100, "feedback": "Configuration Verified"},
        "user_id": user_id
    }
    supabase.table("interview_responses").insert(resp_data).execute()
    print("✅ Interview response inserted.")

    print(f"\n2. Inserting SESSION ANALYSIS for user: {user_id}")
    analysis_data = {
        "session_id": session_id,
        "user_id": user_id,
        "session_name": "Manual Verification Session",
        "fit_analysis": {
            "fit_score": 95,
            "strengths": ["Database Connection", "User Authentication", "Persistence"],
            "weaknesses": ["None detected"],
            "summary": "This record confirms that your account is fully connected and capable of saving data."
        }
    }
    supabase.table("session_analyses").insert(analysis_data).execute()
    print("✅ Session analysis inserted.")

except Exception as e:
    print("\n❌ FAILED to save to database.")
    print(f"Error details: {e}")
