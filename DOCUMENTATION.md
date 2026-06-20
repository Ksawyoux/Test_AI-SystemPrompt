# Agentic Interviewer - Complete Documentation

This document provides a comprehensive overview of the Agentic Interviewer codebase, including the high-level architecture, file hierarchy, and all AI prompts used throughout the system.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
   - [System Overview](#11-system-overview)
   - [Component Diagram](#12-component-diagram)
   - [Technology Stack](#13-technology-stack)
   - [Data Flow](#14-data-flow)
2. [Tree Hierarchy](#2-tree-hierarchy)
   - [Complete File Structure](#21-complete-file-structure)
   - [Key Directories Explained](#22-key-directories-explained)
3. [Prompts Used](#3-prompts-used)
   - [Resume Analysis Prompts](#31-resume-analysis-prompts)
   - [Question Generation Prompts](#32-question-generation-prompts)
   - [Evaluation Prompts](#33-evaluation-prompts)
   - [Report Generation Prompts](#34-report-generation-prompts)
   - [AI Coach Prompts](#35-ai-coach-prompts)

---

## 1. High-Level Architecture

### 1.1 System Overview

Agentic Interviewer is an AI-powered interview platform that consists of three main applications:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AGENTIC INTERVIEWER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │
│  │   Streamlit  │    │   Next.js    │    │       FastAPI            │   │
│  │     App      │    │   Frontend   │    │       Backend            │   │
│  │  (app.py)    │    │  (frontend/) │    │      (backend/)          │   │
│  └──────┬───────┘    └──────┬───────┘    └───────────┬──────────────┘   │
│         │                   │                        │                   │
│         │                   │                        │                   │
│         ▼                   ▼                        ▼                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    External Services                             │    │
│  │                                                                  │    │
│  │  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐   │    │
│  │  │  Google   │  │ Supabase  │  │ LiveKit  │  │    D-ID      │   │    │
│  │  │  Gemini   │  │    DB     │  │  Audio   │  │   Avatar     │   │    │
│  │  │   AI      │  │  + Auth   │  │ Streaming│  │  (Optional)  │   │    │
│  │  └───────────┘  └───────────┘  └──────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Diagram

#### A. Streamlit Application (Standalone)

```
┌─────────────────────────────────────────────────────────────┐
│                    STREAMLIT APP (app.py)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  PDF Upload &   │───▶│  Resume Parser  │                 │
│  │   Processing    │    │   (PyPDF2)      │                 │
│  └─────────────────┘    └────────┬────────┘                 │
│                                  │                          │
│                                  ▼                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AGENTIC AI CHAIN                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │   │
│  │  │ Phase 1:   │  │ Phase 2:   │  │ Phase 3:       │ │   │
│  │  │ Profile    │─▶│ Context    │─▶│ Question       │ │   │
│  │  │ Extraction │  │ Analysis   │  │ Generation     │ │   │
│  │  └────────────┘  └────────────┘  └────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                  │                          │
│                                  ▼                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              INTERVIEW SIMULATION                    │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │   │
│  │  │ Voice      │  │ Real-time  │  │ Interview      │ │   │
│  │  │ Recording  │  │ Evaluation │  │ Report         │ │   │
│  │  │ (WebRTC)   │  │ (Gemini)   │  │ Generation     │ │   │
│  │  └────────────┘  └────────────┘  └────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### B. Next.js + FastAPI Architecture (Production)

```
┌────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                        PAGES (src/app/)                            │ │
│  │                                                                    │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐  │ │
│  │  │   Home     │  │  Dashboard │  │ Simulation │  │   Report    │  │ │
│  │  │  (Landing) │  │  (Stats)   │  │  (Live)    │  │ (Results)   │  │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └─────────────┘  │ │
│  │                                                                    │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────────┐   │ │
│  │  │   Login    │  │   Signup   │  │      New Simulation        │   │ │
│  │  │   (Auth)   │  │   (Auth)   │  │   (5-Step Wizard)          │   │ │
│  │  └────────────┘  └────────────┘  └────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     COMPONENTS (src/components/)                   │ │
│  │                                                                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐   │ │
│  │  │ Animated    │  │  Dashboard  │  │      UI Components       │   │ │
│  │  │ Avatar      │  │  Charts     │  │  (Buttons, Forms, etc)   │   │ │
│  │  └─────────────┘  └─────────────┘  └──────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      LIB (src/lib/)                                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐    │ │
│  │  │   API       │  │  Storage    │  │      Supabase Client    │    │ │
│  │  │  Client     │  │  Utils      │  │   (Auth + Database)     │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      │ HTTP/REST API
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      MAIN.PY (API Routes)                          │ │
│  │                                                                    │ │
│  │  POST /api/analyze-resume        - Resume analysis + questions    │ │
│  │  POST /api/evaluate-response     - Evaluate candidate answers     │ │
│  │  POST /api/generate-report       - Generate interview report      │ │
│  │  POST /api/get-token             - LiveKit token generation       │ │
│  │  GET  /api/dashboard-stats       - Dashboard statistics           │ │
│  │  POST /api/did/create-talk       - D-ID avatar video creation     │ │
│  │  POST /api/query-report          - AI assistant for reports       │ │
│  │  POST /api/ai-recommendations    - AI coach recommendations       │ │
│  │                                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      SERVICES.PY (Business Logic)                  │ │
│  │                                                                    │ │
│  │  • PDF text extraction                                             │ │
│  │  • Candidate profile extraction (AI)                               │ │
│  │  • Job fit analysis (AI)                                           │ │
│  │  • Question generation (AI)                                        │ │
│  │  • Response evaluation (AI)                                        │ │
│  │  • Report generation (AI)                                          │ │
│  │  • AI recommendations (2-step analysis)                            │ │
│  │                                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│  │    DB.PY         │  │     DID.PY       │  │   (Future modules)  │   │
│  │  Supabase Client │  │  D-ID Avatar API │  │                     │   │
│  └──────────────────┘  └──────────────────┘  └─────────────────────┘   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend (Standalone)** | Streamlit | Rapid prototyping, Python-based UI |
| **Frontend (Production)** | Next.js 16, React 19, TypeScript | Modern web application |
| **Backend API** | FastAPI, Python 3.x | RESTful API server |
| **AI/ML** | Google Gemini 2.5 Flash | LLM for all AI tasks |
| **Database** | Supabase (PostgreSQL) | Data persistence + Auth |
| **Real-time Audio** | LiveKit | WebRTC audio streaming |
| **Avatar (Optional)** | D-ID API | Talking avatar videos |
| **PDF Processing** | PyPDF2 / pypdf | Resume text extraction |
| **Text-to-Speech** | gTTS, Web Speech API | Question audio playback |
| **Speech-to-Text** | AssemblyAI, Google STT | Voice transcription |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework |
| **Animation** | Framer Motion | React animations |
| **Charts** | Recharts | Performance visualization |
| **Code Editor** | Monaco Editor | In-browser code editing |

### 1.4 Data Flow

#### Interview Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTERVIEW DATA FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

    ┌────────────┐          ┌────────────┐          ┌─────────────────┐
    │   User     │          │  Frontend  │          │     Backend     │
    │            │          │  (Next.js) │          │    (FastAPI)    │
    └─────┬──────┘          └─────┬──────┘          └────────┬────────┘
          │                       │                          │
          │  1. Upload Resume     │                          │
          │  + Job Description    │                          │
          │──────────────────────▶│                          │
          │                       │                          │
          │                       │  2. POST /api/analyze    │
          │                       │  (PDF + JD + Type)       │
          │                       │─────────────────────────▶│
          │                       │                          │
          │                       │                          │  ┌─────────────┐
          │                       │                          │──│ Gemini AI   │
          │                       │                          │  │ - Profile   │
          │                       │                          │  │ - Fit Score │
          │                       │                          │  │ - Questions │
          │                       │                          │  └─────────────┘
          │                       │                          │
          │                       │  3. Return Analysis      │
          │                       │◀─────────────────────────│
          │                       │                          │
          │  4. Show Results      │                          │
          │◀──────────────────────│                          │
          │                       │                          │
          │  5. Start Interview   │                          │
          │──────────────────────▶│                          │
          │                       │                          │
          │                       │  6. GET LiveKit Token    │
          │                       │─────────────────────────▶│
          │                       │                          │
          │  7. Connect WebRTC    │                          │
          │◀──────────────────────│                          │
          │                       │                          │
          │  8. Answer Question   │                          │
          │  (Voice/Text)         │                          │
          │──────────────────────▶│                          │
          │                       │                          │
          │                       │  9. POST /api/evaluate   │
          │                       │─────────────────────────▶│
          │                       │                          │
          │                       │                          │  ┌─────────────┐
          │                       │                          │──│ Gemini AI   │
          │                       │                          │  │ - Score     │
          │                       │                          │  │ - Feedback  │
          │                       │                          │  └─────────────┘
          │                       │                          │
          │                       │  10. Store in Supabase   │
          │                       │                          │──────┐
          │                       │                          │      │ DB
          │                       │                          │◀─────┘
          │                       │                          │
          │                       │  11. Return Evaluation   │
          │                       │◀─────────────────────────│
          │                       │                          │
          │  12. Show Feedback    │                          │
          │◀──────────────────────│                          │
          │                       │                          │
          │  [Repeat 8-12 for each question]                 │
          │                       │                          │
          │  13. Request Report   │                          │
          │──────────────────────▶│                          │
          │                       │                          │
          │                       │  14. POST /api/report    │
          │                       │─────────────────────────▶│
          │                       │                          │
          │                       │                          │  ┌─────────────┐
          │                       │                          │──│ Gemini AI   │
          │                       │                          │  │ - Report    │
          │                       │                          │  │ - Hiring    │
          │                       │                          │  │   Decision  │
          │                       │                          │  └─────────────┘
          │                       │                          │
          │  15. Display Report   │                          │
          │◀──────────────────────│◀─────────────────────────│
          │                       │                          │
          ▼                       ▼                          ▼
```

---

## 2. Tree Hierarchy

### 2.1 Complete File Structure

```
Test_AI-SystemPrompt/
│
├── .env                           # Environment variables (API keys)
├── .gitignore                     # Git ignore rules
├── README.md                      # Project overview
├── DOCUMENTATION.md               # This documentation file
├── requirements.txt               # Python dependencies (Streamlit app)
│
├── app.py                         # STANDALONE STREAMLIT APPLICATION
│                                  # - Full interview flow in single file
│                                  # - PDF upload, question generation, live interview
│                                  # - Uses WebRTC for voice recording
│                                  # - Text-to-speech with gTTS
│
├── backend/                       # FASTAPI BACKEND SERVICE
│   ├── __init__.py               # Package marker
│   ├── main.py                   # API routes and endpoints
│   │                              # - /api/analyze-resume
│   │                              # - /api/evaluate-response
│   │                              # - /api/generate-report
│   │                              # - /api/get-token (LiveKit)
│   │                              # - /api/dashboard-stats
│   │                              # - /api/did/* (D-ID avatar)
│   │                              # - /api/query-report
│   │                              # - /api/ai-recommendations
│   │
│   ├── services.py               # Business logic and AI prompts
│   │                              # - extract_pdf_text()
│   │                              # - run_candidate_profile_extraction()
│   │                              # - analyze_candidate_fit()
│   │                              # - generate_questions_from_jd()
│   │                              # - evaluate_single_response()
│   │                              # - generate_interview_report()
│   │                              # - query_report()
│   │                              # - generate_ai_recommendations()
│   │
│   ├── db.py                     # Supabase database client
│   │                              # - Connection initialization
│   │                              # - Environment variable handling
│   │
│   ├── did.py                    # D-ID Avatar API integration
│   │                              # - create_clip()
│   │                              # - get_clip()
│   │                              # - create_and_wait_for_talk()
│   │
│   ├── requirements.txt          # Backend Python dependencies
│   └── .env                      # Backend environment variables
│
└── frontend/                      # NEXT.JS FRONTEND APPLICATION
    │
    ├── .gitignore                # Frontend git ignore
    ├── README.md                 # Frontend documentation
    ├── package.json              # Node.js dependencies
    ├── package-lock.json         # Dependency lock file
    ├── next.config.ts            # Next.js configuration
    ├── tsconfig.json             # TypeScript configuration
    ├── postcss.config.mjs        # PostCSS configuration
    ├── eslint.config.mjs         # ESLint configuration
    └── vercel.json               # Vercel deployment config
    │
    ├── public/                   # Static assets
    │   └── (images, icons)
    │
    └── src/                      # SOURCE CODE
        │
        ├── middleware.ts         # Next.js middleware (auth protection)
        │
        ├── app/                  # APP ROUTER (Pages)
        │   │
        │   ├── layout.tsx        # Root layout (ThemeProvider, fonts)
        │   ├── page.tsx          # Landing page (/)
        │   ├── globals.css       # Global styles
        │   ├── favicon.ico       # Site favicon
        │   │
        │   ├── login/            # Authentication
        │   │   └── page.tsx      # Login page
        │   │
        │   ├── signup/           # User registration
        │   │   └── page.tsx      # Signup page
        │   │
        │   ├── auth/             # Auth callbacks
        │   │   └── callback/     # OAuth callback handler
        │   │
        │   └── dashboard/        # PROTECTED DASHBOARD AREA
        │       │
        │       ├── layout.tsx    # Dashboard layout (sidebar, navbar)
        │       ├── page.tsx      # Dashboard home (stats, charts)
        │       │
        │       ├── new-simulation/
        │       │   └── page.tsx  # 5-step wizard for new interview
        │       │                  # Step 1: Job Description input
        │       │                  # Step 2: Resume upload
        │       │                  # Step 3: Interview type selection
        │       │                  # Step 4: AI analysis (loading)
        │       │                  # Step 5: Review & Start
        │       │
        │       ├── simulation/
        │       │   └── page.tsx  # Live interview simulation
        │       │                  # - Animated AI avatar (Aya)
        │       │                  # - Voice recording with transcription
        │       │                  # - Real-time evaluation
        │       │                  # - Code editor (technical mode)
        │       │                  # - Lockdown mode (fullscreen)
        │       │
        │       ├── report/
        │       │   └── [id]/     # Dynamic route
        │       │       └── page.tsx  # Interview report display
        │       │                      # - Score breakdown
        │       │                      # - Strengths & weaknesses
        │       │                      # - AI recommendations
        │       │                      # - Ask AI assistant
        │       │
        │       ├── campaigns/
        │       │   └── page.tsx  # Campaign/session history
        │       │
        │       ├── profile/
        │       │   └── page.tsx  # User profile settings
        │       │
        │       └── settings/
        │           └── page.tsx  # Application settings
        │
        ├── components/           # REACT COMPONENTS
        │   │
        │   ├── AnimatedAvatar.tsx    # AI interviewer avatar with animations
        │   ├── DashboardNavbar.tsx   # Top navigation bar
        │   ├── Features.tsx          # Landing page features section
        │   ├── Footer.tsx            # Site footer
        │   ├── Hero.tsx              # Landing page hero section
        │   ├── Navbar.tsx            # Public site navbar
        │   ├── ThemeProvider.tsx     # Dark/light theme context
        │   ├── ThemeToggle.tsx       # Theme switch button
        │   ├── TiltCardGrid.tsx      # Interactive tilt cards
        │   ├── UseCases.tsx          # Use cases section
        │   ├── Workflow.tsx          # How it works section
        │   │
        │   ├── dashboard/            # Dashboard-specific components
        │   │   ├── CodeEditorPanel.tsx      # Monaco editor for coding
        │   │   ├── InterviewCard.tsx        # Interview session card
        │   │   ├── PerformanceChart.tsx     # Recharts line chart
        │   │   └── RecommendationSidebar.tsx # AI recommendations
        │   │
        │   └── ui/                   # Reusable UI primitives
        │       ├── MagneticButton.tsx    # Hover-magnetic button
        │       └── NeuralTextArea.tsx    # Enhanced textarea
        │
        └── lib/                  # UTILITIES & SERVICES
            │
            ├── api.ts            # API client functions
            │                      # - analyzeResume()
            │                      # - evaluateResponse()
            │                      # - generateReport()
            │                      # - getLiveKitToken()
            │                      # - getDashboardStats()
            │                      # - createDIDTalk()
            │                      # - queryReport()
            │                      # - getAIRecommendations()
            │
            ├── storage.ts        # LocalStorage utilities
            │                      # - Interview session management
            │                      # - Completed interview history
            │
            └── supabase/         # Supabase integration
                ├── client.ts     # Browser-side Supabase client
                └── server.ts     # Server-side Supabase client
```

### 2.2 Key Directories Explained

#### `/app.py` - Streamlit Standalone Application
A complete, self-contained interview application built with Streamlit. It includes:
- PDF resume upload and parsing
- Multi-phase AI chain (profile extraction → context analysis → question generation)
- Live interview simulation with voice recording
- Real-time evaluation and scoring
- Final report generation

#### `/backend/` - FastAPI Backend
Production-grade REST API that powers the Next.js frontend:
- **main.py**: All API endpoints with request/response handling
- **services.py**: Core business logic including all AI prompts
- **db.py**: Supabase database connection
- **did.py**: D-ID avatar video generation

#### `/frontend/` - Next.js Frontend
Modern React application with:
- **src/app/**: Page components using Next.js App Router
- **src/components/**: Reusable React components
- **src/lib/**: API clients, utilities, and Supabase integration

---

## 3. Prompts Used

This section documents all AI prompts used in the system. These prompts are sent to Google Gemini AI to generate interview content, evaluate responses, and create reports.

### 3.1 Resume Analysis Prompts

#### 3.1.1 Candidate Profile Extraction

**Purpose:** Extract structured profile information from a resume.

**Location:** `backend/services.py` → `run_candidate_profile_extraction()`

```
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
{
    "current_role": "Job Title",
    "location": "City, Country",
    "educational_level": "Degree (Field if available)",
    "experience_years": 5,
    "experience_breakdown": "Brief breakdown of how years were calculated"
}
```

#### 3.1.2 Candidate-Job Fit Analysis

**Purpose:** Analyze how well a candidate's resume matches the job requirements.

**Location:** `backend/services.py` → `analyze_candidate_fit()`

```
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
{
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
}
```

#### 3.1.3 Context Analysis (Streamlit App)

**Purpose:** Analyze resume and generate a job description context for question generation.

**Location:** `app.py` → `run_context_analysis()` and `backend/services.py` → `run_context_analysis()`

```
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
{
    "campaign_context": "Brief summary of interview focus areas...",
    "job_description": "Full markdown-formatted job description..."
}
```

---

### 3.2 Question Generation Prompts

#### 3.2.1 Generate Questions from Job Description

**Purpose:** Generate interview questions based on job requirements.

**Location:** `backend/services.py` → `generate_questions_from_jd()`

```
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
{
    "questions": [
        {
            "id": 1,
            "title": "Topic from JD",
            "question_text": "The actual interview question to ask",
            "difficulty": "Easy",
            "max_points": 5,
            "scoring_criteria": "What to look for in a good answer"
        }
    ]
}
```

#### 3.2.2 Generate Questions from Resume Context (Streamlit)

**Purpose:** Generate questions based on analyzed resume context.

**Location:** `app.py` → `run_question_generation()` and `backend/services.py` → `run_question_generation()`

```
You are an Expert Interviewer focusing on {interview_type} skills.
Your goal is to create interview questions based on the core competencies required.

INPUT CONTEXT:
{campaign_context}
{job_description}

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
{
    "questions": [
        {
            "id": 1,
            "title": "Topic Name",
            "question_text": "The actual interview question to ask",
            "difficulty": "Easy",
            "max_points": 5,
            "scoring_criteria": "What to look for in a good answer"
        }
    ]
}
```

---

### 3.3 Evaluation Prompts

#### 3.3.1 Evaluate Single Response

**Purpose:** Score and provide feedback on a candidate's answer to an interview question.

**Location:** `backend/services.py` → `evaluate_single_response()` and `app.py` → `evaluate_single_response()`

```
You are an expert technical interviewer evaluating a candidate's response.

QUESTION:
Title: {question.title}
Question: {question.question_text}
Difficulty: {question.difficulty}
Max Points: {question.max_points}
Scoring Criteria: {question.scoring_criteria}

{code_context}  # Optional: Included if code snippet is provided

CANDIDATE'S VERBAL RESPONSE:
"{response}"

TASK:
Evaluate the response (and code if provided) and provide:
1. A score out of the max points
2. Brief feedback on what was good
3. Brief feedback on what could be improved

OUTPUT (JSON only):
{
    "score": 7,
    "max_points": 10,
    "feedback_positive": "Brief positive feedback",
    "feedback_improvement": "Brief improvement suggestion"
}
```

---

### 3.4 Report Generation Prompts

#### 3.4.1 Generate Interview Report

**Purpose:** Create a comprehensive interview evaluation report combining resume analysis and interview performance.

**Location:** `backend/services.py` → `generate_interview_report()` and `app.py` → `generate_interview_report()`

```
You are a Senior HR Manager writing a comprehensive interview evaluation report.

Your task is to synthesize insights from TWO sources:
1. **Resume Analysis**: What we learned about the candidate BEFORE the interview
2. **Interview Performance**: How the candidate actually performed during the interview

{profile_info}

{resume_analysis}

INTERVIEW PERFORMANCE:
Total Score: {total_score}/{max_total} ({percentage}%)

QUESTION-BY-QUESTION BREAKDOWN:
{qa_summary_json}

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
{
    "overall_score": {total_score},
    "max_score": {max_total},
    "percentage": {percentage},
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
}
```

#### 3.4.2 Query Report (Ask AI Assistant)

**Purpose:** Answer user questions about a specific interview report.

**Location:** `backend/services.py` → `query_report()`

```
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
{
    "answer": "The detailed response",
}
```

---

### 3.5 AI Coach Prompts

#### 3.5.1 Gap Analysis (Step 1)

**Purpose:** Identify gaps between candidate's responses and expected answers based on the job requirements.

**Location:** `backend/services.py` → `generate_ai_recommendations()` (Step 1)

```
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
{
    "omitted_technical_concepts": ["concept1", "concept2", "concept3"],
    "generic_phrases_detected": ["phrase1", "phrase2"],
    "missing_data_points": ["datapoint1", "datapoint2"]
}
```

#### 3.5.2 Generate Recommendations (Step 2)

**Purpose:** Generate actionable coaching recommendations based on the identified gaps.

**Location:** `backend/services.py` → `generate_ai_recommendations()` (Step 2)

```
Using the extracted gaps, generate 3 specific, deep-dive recommendations for the AI Coach sidebar.

GAPS ANALYSIS:
- Omitted Technical Concepts: {omitted_concepts}
- Generic Phrases Detected: {generic_phrases}
- Missing Data Points: {missing_data_points}

ORIGINAL REPORT CONTEXT:
{source_report_text}

INSTRUCTIONS:
1. For every "generic phrase" identified, provide a technical replacement using concepts from the report.
2. Formulate "Technical Depth" advice that requires the candidate to explain the LOGIC, not just state the result.
3. Ensure the advice is pragmatically useful and actionable.
4. Generate exactly 3 recommendations in three categories: Technical Depth, Communication Style, Speaking Pace.

OUTPUT FORMAT (JSON only):
{
    "recommendations": [
        {
            "category": "Technical Depth",
            "content": "Specific actionable advice about technical concepts to mention and how to explain them with logic"
        },
        {
            "category": "Communication Style", 
            "content": "Specific advice about replacing generic phrases with data-backed statements"
        }
    ],
    "confidence_score": 85,
    "gaps_summary": "Brief summary of most critical gaps identified"
}
```

---

## Summary

This documentation provides a complete overview of the Agentic Interviewer system:

1. **Architecture**: Three interconnected applications (Streamlit standalone, Next.js frontend, FastAPI backend) all powered by Google Gemini AI.

2. **File Structure**: Organized into clear directories separating frontend, backend, and standalone application code.

3. **AI Prompts**: Nine distinct prompt templates handle everything from resume parsing to interview evaluation to personalized coaching recommendations.

The system follows a multi-phase "agentic" approach where each AI call builds on the previous one, creating a comprehensive interview experience that combines resume analysis, dynamic question generation, real-time evaluation, and detailed reporting.
