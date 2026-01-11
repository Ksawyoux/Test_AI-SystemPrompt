#!/usr/bin/env python3
"""
Test Script for Interview Session Storage
==========================================

This script tests the end-to-end flow of:
1. Saving an interview session to the database
2. Evaluating responses and storing them
3. Retrieving the session and responses

It uses the TWO specific interview questions provided by the user.
"""

import asyncio
import httpx
import json
import time
from uuid import uuid4

# Configuration
API_BASE = "http://localhost:8000"

# Test Interview Questions (from user)
TEST_QUESTIONS = [
    {
        "id": 1,
        "title": "Production AI System Optimization",
        "question_text": "You are tasked with leading the optimization of a production AI system that occasionally produces suboptimal or incorrect outputs due to subtle context ambiguities or unforeseen edge cases, despite initial rigorous testing. This role specifically highlights using specialized tuning systems and feedback loops to programmatically refine contextual inputs and model instructions. Describe a challenging situation where you had to diagnose and improve the performance of a complex, live system with unclear root causes. What methodologies, tools, or feedback mechanisms did you implement to identify the issues, gather relevant data, and systematically refine the system's behavior over time, especially when dealing with the inherent probabilistic nature of LLMs and the need for context engineering?",
        "difficulty": "Hard",
        "max_points": 50,
        "scoring_criteria": "Evaluate for: root cause analysis methodology, use of observability tools, A/B testing, prompt versioning, feedback loop design, context engineering strategies, handling probabilistic outputs"
    },
    {
        "id": 2,
        "title": "Agentic Workflow Architecture",
        "question_text": "This role emphasizes architecting agentic workflows and using prompt chaining to decompose complex problems, along with ensuring data integrity via structured outputs. Imagine a scenario where you're building an AI system that needs to process a user's natural language request, retrieve relevant information from multiple external databases, synthesize that information, and then generate a structured report (e.g., JSON or XML). Describe a challenging, multi-step problem you've encountered that required a similar decomposition strategy. How did you break down the initial request into manageable sub-problems, and what specific steps did you take to ensure data integrity and prevent errors or hallucinations as information flowed between different AI components and external tools?",
        "difficulty": "Hard",
        "max_points": 50,
        "scoring_criteria": "Evaluate for: problem decomposition skills, prompt chaining architecture, structured output validation, error handling between components, data integrity mechanisms, hallucination prevention strategies"
    }
]

# Sample responses to the questions (for testing)
TEST_RESPONSES = [
    """In my previous role, I led the optimization of a production recommendation system that was experiencing a 15% degradation in relevance scores. 

**Root Cause Analysis:**
I implemented a multi-layered observability approach: 
1. Added detailed logging at every model inference step with context snapshots
2. Created a shadow evaluation pipeline that compared production outputs against a baseline model
3. Built a 'context drift detector' that flagged when input distributions shifted

**Feedback Loop Implementation:**
- Established A/B testing infrastructure with statistical significance thresholds
- Created a prompt versioning system with rollback capabilities
- Implemented human-in-the-loop evaluation for edge cases using a grading rubric

**Context Engineering Strategy:**
The key breakthrough was recognizing that the context window was being overwhelmed by irrelevant historical data. I:
- Implemented dynamic context pruning based on recency and relevance scores
- Added explicit instruction boundaries with XML-like markers
- Created a 'context budget' system that allocated tokens based on task complexity

**Handling Probabilistic Nature:**
- Implemented temperature calibration per task type
- Added confidence scoring with threshold-based fallback to deterministic rules
- Created ensemble voting across multiple prompt variations for critical decisions

This reduced hallucination rates by 40% and improved user satisfaction scores by 25%.""",

    """I architected a multi-agent system for processing insurance claims that required decomposing complex natural language requests into structured workflows.

**Problem Decomposition:**
The system handled claims like "My car was damaged in a flood, I also have receipts for emergency hotel stays."
I broke this into:
1. **Intent Extraction Agent**: Identifies claim type (auto + emergency expense)
2. **Entity Extraction Agent**: Pulls dates, amounts, policy numbers
3. **Document Classification Agent**: Routes uploaded images/PDFs
4. **Database Query Agent**: Retrieves policy details, coverage limits, deductibles
5. **Synthesis Agent**: Combines all data into coverage assessment
6. **Report Generation Agent**: Produces structured JSON output

**Prompt Chaining Architecture:**
Each agent output strict JSON schemas validated with Pydantic:
```python
class ClaimIntent(BaseModel):
    claim_type: Literal["auto", "home", "health", "travel"]
    sub_types: List[str]
    confidence: float
```

**Data Integrity Mechanisms:**
1. **Schema Validation**: Every inter-agent message validated against JSON Schema
2. **Hallucination Prevention**: Cross-referenced extracted entities against source documents
3. **Citation Tracking**: Each synthesized fact linked to its source document/database
4. **Confidence Propagation**: Uncertainty scores flowed through the pipeline, triggering human review below thresholds

**Error Handling:**
- Circuit breakers between agents preventing cascade failures
- Retry logic with exponential backoff for database queries
- Fallback to simpler models when complex queries failed
- Audit trail logging every transformation for debugging

This architecture processed 10,000+ claims/day with 99.2% accuracy and reduced processing time from 3 days to 4 hours."""
]


async def test_save_session():
    """Test saving a complete session to the database."""
    session_id = str(uuid4())
    # Use the actual user ID provided
    user_id = "6a52078e-fed4-46dd-8129-d394f25d4491"
    
    print(f"\n{'='*60}")
    print("TEST 1: Saving Interview Session to Database")
    print(f"{'='*60}")
    print(f"Session ID: {session_id}")
    print(f"User ID: {user_id}")
    
    payload = {
        "session_id": session_id,
        "session_name": "AI Systems Engineer Interview",
        "user_id": user_id,
        "fit_analysis": {
            "fit_score": 85,
            "strengths": [
                "Strong LLM experience: 5+ years building production AI systems",
                "Agentic workflows: Built multi-agent orchestration systems",
                "Data integrity: Experience with structured output validation"
            ],
            "weaknesses": [
                "Limited WebRTC experience",
                "No Kubernetes mentioned"
            ],
            "summary": "Strong candidate for AI systems role"
        },
        "questions": TEST_QUESTIONS,
        "profile": {
            "current_role": "Senior AI Engineer",
            "experience_years": 7,
            "educational_level": "Master's in Computer Science",
            "location": "San Francisco, CA"
        },
        "job_description": "AI Systems Engineer role focused on building production LLM systems with agentic workflows",
        "interview_type": "technical"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{API_BASE}/api/save-session-analysis",
                json=payload,
                timeout=30.0
            )
            result = response.json()
            print(f"\n✅ Session save result: {result}")
            return session_id, user_id
        except Exception as e:
            print(f"\n❌ Failed to save session: {e}")
            return None, None


async def test_evaluate_responses(session_id: str, user_id: str):
    """Test evaluating responses and storing them."""
    print(f"\n{'='*60}")
    print("TEST 2: Evaluating Interview Responses")
    print(f"{'='*60}")
    
    evaluations = []
    
    async with httpx.AsyncClient() as client:
        for i, (question, response) in enumerate(zip(TEST_QUESTIONS, TEST_RESPONSES)):
            print(f"\n--- Question {i+1}: {question['title']} ---")
            print(f"Response preview: {response[:100]}...")
            
            payload = {
                "session_id": session_id,
                "session_name": "AI Systems Engineer Interview",
                "user_id": user_id,
                "question": question,
                "response_text": response,
            }
            
            try:
                response_obj = await client.post(
                    f"{API_BASE}/api/evaluate-response",
                    json=payload,
                    timeout=60.0
                )
                evaluation = response_obj.json()
                evaluations.append(evaluation)
                print(f"✅ Score: {evaluation.get('score', 'N/A')}/{question['max_points']}")
                print(f"   Positive: {evaluation.get('feedback_positive', 'N/A')[:80]}...")
                print(f"   Improve: {evaluation.get('feedback_improvement', 'N/A')[:80]}...")
            except Exception as e:
                print(f"❌ Evaluation failed: {e}")
    
    return evaluations


async def test_verify_storage(session_id: str):
    """Verify that data was stored correctly."""
    print(f"\n{'='*60}")
    print("TEST 3: Verifying Database Storage")
    print(f"{'='*60}")
    
    async with httpx.AsyncClient() as client:
        # Check session analysis
        try:
            response = await client.get(
                f"{API_BASE}/api/session-analysis/{session_id}",
                timeout=10.0
            )
            session = response.json()
            if session:
                print(f"✅ Session found in database")
                print(f"   Session Name: {session.get('session_name', 'N/A')}")
                print(f"   Questions: {len(session.get('questions', [])) if session.get('questions') else 'Not stored'}")
                print(f"   Interview Type: {session.get('interview_type', 'N/A')}")
            else:
                print("❌ Session not found in database")
        except Exception as e:
            print(f"❌ Failed to retrieve session: {e}")
        
        # Check responses
        try:
            response = await client.get(
                f"{API_BASE}/api/debug/list-responses",
                timeout=10.0
            )
            data = response.json()
            matching = [r for r in data.get('responses', []) if r.get('session_id') == session_id]
            print(f"\n✅ Found {len(matching)} response(s) for session {session_id}")
            for r in matching:
                print(f"   - Q: {r.get('question_text', 'N/A')[:50]}...")
        except Exception as e:
            print(f"❌ Failed to check responses: {e}")


async def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("🧪 INTERVIEW SESSION STORAGE TEST SUITE")
    print("="*60)
    print(f"Testing against: {API_BASE}")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check server is running
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{API_BASE}/", timeout=5.0)
            print(f"✅ Server is running")
        except:
            print(f"❌ Server not reachable at {API_BASE}")
            return
    
    # Run tests
    session_id, user_id = await test_save_session()
    
    if session_id:
        await asyncio.sleep(1)  # Brief pause for DB writes
        await test_evaluate_responses(session_id, user_id)
        await asyncio.sleep(1)
        await test_verify_storage(session_id)
    
    print("\n" + "="*60)
    print("🏁 TEST SUITE COMPLETE")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
