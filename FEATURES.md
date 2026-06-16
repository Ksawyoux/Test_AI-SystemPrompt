# 📋 Agentic Interviewer - Features & Functionalities Summary

> A comprehensive AI-powered interview simulation and candidate assessment platform

---

## 🎯 Overview

**Agentic Interviewer** is a full-stack application that leverages Google Gemini AI to provide intelligent interview preparation and assessment. The platform helps candidates practice interviews and enables recruiters to evaluate candidates through automated, AI-driven processes.

---

## 🚀 Core Features

### 1. Resume Analysis & Processing
- **PDF Resume Parsing**: Extracts text content from PDF resumes using PyPDF2/pypdf
- **AI-Powered Profile Extraction**: Identifies and extracts:
  - Current job role/title
  - Location
  - Educational background
  - Total years of experience
  - Technical skills and competencies

### 2. Job-Candidate Fit Analysis
- **Automated Fit Assessment**: Analyzes how well a candidate matches a job description
- **Scoring System**: Generates a fit score (0-100%)
- **Strengths Identification**: Highlights candidate strengths relevant to the role
- **Gap Analysis**: Identifies areas where the candidate may not fully meet requirements
- **Summary Generation**: Provides an overall assessment of candidate-job alignment

### 3. Interview Question Generation
- **Dynamic Question Creation**: Generates role-specific interview questions based on:
  - Job description requirements
  - Candidate's resume/profile
  - Interview type preference
- **Interview Types Supported**:
  - **Technical**: Focus on Data Structures & Algorithms (Simple to Medium)
  - **Behavioral/Abstract**: STAR method, culture fit, soft skills
  - **Mixed**: Balanced combination of technical and behavioral
- **Difficulty Levels**:
  - 🟢 **Easy**: 3-7 points
  - 🟠 **Medium**: 7-10 points
  - 🔴 **Hard**: 10-15 points
- **Scoring Criteria**: Each question includes detailed guidance on evaluation
- **Balanced Scoring**: Total points automatically calibrated to 100

### 4. Live Interview Simulation
- **Voice Recording**: Record spoken responses using browser microphone or LiveKit
- **Text-to-Speech (TTS)**: AI reads questions aloud using gTTS
- **Speech-to-Text (STT)**: Transcribe responses using:
  - AssemblyAI (primary)
  - Google Speech Recognition (fallback)
- **Real-time AI Feedback**: Instant evaluation and feedback on each response
- **Progress Tracking**: Track performance across multiple questions

### 5. Code Execution Environment
- **Live Code Editor**: Monaco-based editor for writing code during technical interviews
- **Supported Languages**:
  - Python
  - JavaScript
- **Security Features**:
  - 5-second timeout limit
  - 10KB output limit
  - Blocked dangerous imports (os, subprocess, sys, socket, shutil)
  - Blocked dangerous functions (eval, exec, open, compile, __import__)
  - Sandboxed execution in /tmp directory
- **Output Display**: Shows execution results, errors, and execution time

### 6. AI-Powered Response Evaluation
- **Intelligent Scoring**: AI evaluates each response against:
  - Question difficulty
  - Maximum points available
  - Specific scoring criteria
- **Feedback Components**:
  - Positive feedback (what was good)
  - Improvement suggestions (areas to work on)
- **Code Assessment**: Evaluates both verbal responses and submitted code

### 7. Interview Report Generation
- **Comprehensive Reports**: Combines resume analysis and interview performance
- **Report Contents**:
  - Overall score and percentage
  - 3 key strengths (with evidence)
  - 3 areas for improvement
  - Actionable recommendations
  - Hiring recommendation (Hire/Strong Hire/Maybe/No Hire)
  - Detailed rationale

### 8. AI Assistant & Coach
- **Report Q&A**: Ask AI questions about your interview report
- **2-Step Gap Analysis**:
  1. **Gap Identification**: Finds omitted technical concepts and generic phrases
  2. **Recommendations**: Generates actionable improvement advice
- **Coaching Categories**:
  - Technical Depth
  - Communication Style
  - Speaking Pace

### 9. Video Avatar Integration (D-ID)
- **AI Talking Avatar**: Creates realistic video avatars for interview simulation
- **Video Status Tracking**: Monitor avatar video generation progress

---

## 🖥️ Frontend Features

### User Interface
- **Modern Design**: Built with Next.js 14 and Tailwind CSS
- **Responsive Layout**: Works across devices
- **Dark/Light Theme**: Theme toggle support via ThemeProvider
- **Smooth Animations**: Framer Motion for page transitions and micro-interactions

### Dashboard
- **Performance Overview**: Visual statistics and metrics
- **Interview History**: View past interview sessions (Campaigns)
- **Performance Charts**: Recharts-based visualizations
- **AI Coach Sidebar**: Real-time recommendations during interviews

### Pages & Routes
- **Landing Page**: Hero section, features showcase, use cases
- **Login/Signup**: User authentication via Supabase Auth
- **Dashboard**: Main user interface with statistics
- **New Simulation**: Start a new interview session
- **Simulation**: Live interview interface
- **Report View**: Detailed interview report display
- **User Profile**: Account management

### Interactive Components
- **Tilt Cards**: Interactive card grid for features
- **Animated Avatar**: Visual avatar component
- **Code Editor Panel**: Full-featured code editor with execution
- **Recommendation Sidebar**: AI coaching suggestions

---

## ⚙️ Backend Features

### API Endpoints

#### Core Interview APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze-resume` | POST | Upload resume, analyze fit, generate questions |
| `/api/evaluate-response` | POST | Evaluate a single interview response |
| `/api/generate-report` | POST | Generate final interview report |

#### Session & Dashboard APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/save-session-analysis` | POST | Save CV fit analysis |
| `/api/session-analysis/{id}` | GET | Retrieve session analysis |
| `/api/dashboard-stats` | GET | Get aggregated statistics |

#### AI Assistant APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/query-report` | POST | Ask AI about a report |
| `/api/ai-recommendations` | POST | Get 2-step gap analysis |

#### Integration APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/get-token` | POST | Generate LiveKit access token |
| `/api/did/create-talk` | POST | Create D-ID avatar video |
| `/api/did/talk/{id}` | GET | Get D-ID video status |
| `/api/execute-code` | POST | Execute Python/JS code |

---

## 📊 AI Evaluation Suite

A dedicated module for evaluating and improving AI feedback quality.

### Components

#### 1. Agent Response Assessment
- **Purpose**: Evaluate factual correctness of AI outputs
- **Method**: Basic exact-match accuracy metrics

#### 2. LLM-as-a-Judge Framework
- **Purpose**: Evaluate subjective qualities of AI feedback
- **Evaluation Dimensions**:
  - Helpfulness (is it actionable?)
  - Specificity (does it reference specific parts?)
  - Accuracy (is assessment correct?)
  - Constructiveness (is tone encouraging?)
  - Fairness (is scoring well-calibrated?)
- **Integration**: Connects to Supabase for real interview data

#### 3. Evaluation Dashboard
- **Real-time Metrics**: Average Quality, Helpfulness, Calibration Bias
- **Visualizations**: Score comparison charts, radar plots
- **Detailed Inspection**: View full evaluation rationale
- **Prompt Optimizer UI**: Manage the prompt improvement loop

#### 4. Advanced Prompt Optimizer
- **5-Stage Architecture**:
  1. **Collect Evidence**: Aggregate human/LLM judge scores
  2. **Analyze Patterns**: Identify root causes
  3. **Generate Candidates**: Create prompt variations
  4. **A/B Test**: Simulate on "Golden Set"
  5. **Deploy**: Select and prepare best prompt

---

## 🔐 Data & Security

### Database (Supabase PostgreSQL)

#### Tables
| Table | Purpose |
|-------|---------|
| `interview_responses` | Individual question responses and evaluations |
| `session_analyses` | Fit analysis and session metadata |
| `users` | User authentication (Supabase Auth) |

### Security Features
- **Authentication**: Supabase Auth with middleware protection
- **Code Execution Sandbox**: Safe execution environment
- **API Key Protection**: Environment variable management
- **Input Validation**: Blocked dangerous operations

---

## 🛠️ Technology Stack

### Backend
| Component | Technology |
|-----------|------------|
| API Framework | FastAPI |
| AI Model | Google Gemini 2.5 Flash |
| PDF Processing | PyPDF2 / pypdf |
| Video Conferencing | LiveKit |
| Avatar Generation | D-ID API |
| Database | Supabase (PostgreSQL) |

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| Authentication | Supabase Auth |
| Icons | Lucide React |
| Code Editor | Monaco Editor |

### Audio/Media
| Component | Technology |
|-----------|------------|
| Text-to-Speech | gTTS |
| Speech-to-Text | AssemblyAI, Google Speech Recognition |
| Audio Streaming | streamlit-webrtc, LiveKit |
| Audio Processing | PyAV, NumPy, Wave |

---

## 🚀 Deployment

### Backend
- Run with Uvicorn: `python3.11 -m uvicorn backend.main:app --reload --port 8000`

### Frontend
- Deploy to Vercel with root directory set to `frontend`
- Configure Supabase environment variables

### Streamlit App (Alternative)
- Simple interface: `streamlit run app.py`

---

## 📦 Key Dependencies

### Python
- `google-generativeai` - Google Gemini AI
- `fastapi` - API framework
- `pypdf` / `PyPDF2` - PDF processing
- `gtts` - Text-to-speech
- `assemblyai` - Speech transcription
- `livekit` - Real-time video
- `streamlit` - Web interface

### JavaScript/Node.js
- `next` - React framework
- `tailwindcss` - CSS framework
- `framer-motion` - Animations
- `recharts` - Data visualization
- `@supabase/supabase-js` - Database client
- `monaco-editor` - Code editor

---

## 📄 Summary

**Agentic Interviewer** provides an end-to-end solution for:

✅ **Candidates**: Practice interviews with AI feedback, improve responses, and track progress

✅ **Recruiters**: Automate initial screening, generate consistent evaluations, and save time

✅ **Developers**: Extend the platform with a modular architecture and well-documented APIs

The platform combines advanced AI capabilities with a modern, user-friendly interface to deliver a comprehensive interview preparation and assessment experience.

---

*Generated for the Agentic Interviewer Platform*
