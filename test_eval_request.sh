#!/bin/bash
curl -X POST http://localhost:8000/api/evaluate-response \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "curl-test-session",
    "user_id": "curl-test-user",
    "question": {
      "id": 999,
      "title": "Curl Test",
      "question_text": "Is this working?",
      "difficulty": "Easy",
      "max_points": 10,
      "scoring_criteria": "Yes/No"
    },
    "response_text": "Yes, I am testing via curl."
  }'
