# 🎯 Agentic Interviewer

AI-powered interview platform using Google Gemini. Upload a resume, generate tailored interview questions, and conduct **live voice-based mock interviews** with real-time AI evaluation.

## ✨ Features

### Resume Analysis & Question Generation
- **Resume Analysis** - Extracts skills, experience, and domain expertise from PDF resumes
- **Job Description Generation** - Creates a relevant job description based on the candidate's profile
- **Smart Question Generation** - Produces 10 technical interview questions covering key competencies
- **Difficulty-Based Scoring**:
  - 🟢 Easy: 3-7 points
  - 🟠 Medium: 7-10 points
  - 🔴 Hard: 10-15 points
- **Scoring Criteria** - Each question includes guidance on what to look for in answers

### 🎤 Live Interview Simulation
- **Voice Recording** - Record spoken responses using browser microphone or LiveKit
- **Text-to-Speech** - AI reads questions aloud using gTTS
- **Speech-to-Text** - Transcribe responses using AssemblyAI or Google Speech Recognition
- **Real-time Evaluation** - AI evaluates each response and provides instant feedback
- **Comprehensive Report** - Get a detailed interview report with strengths, weaknesses, and hiring recommendation

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd Test_AI-SystemPrompt
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Get your API keys:
- **Gemini API** (required): [Google AI Studio](https://aistudio.google.com/apikey)
- **AssemblyAI** (optional, for better transcription): [AssemblyAI](https://www.assemblyai.com/)
- **LiveKit** (optional, for advanced audio): [LiveKit](https://livekit.io/)

Edit the `.env` file:

```env
GEMINI_API_KEY=your_gemini_key_here

# Optional - Enhanced transcription
ASSEMBLYAI_API_KEY=your_assemblyai_key_here

# Optional - LiveKit for advanced audio features
LIVEKIT_API_KEY=your_livekit_key_here
LIVEKIT_API_SECRET=your_livekit_secret_here
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
```

### 3. Run

```bash
streamlit run app.py
```

Open [http://localhost:8501](http://localhost:8501) in your browser.

## 📖 Usage

### Question Generation Mode
1. Upload a PDF resume
2. Wait for AI analysis (~10-20 seconds)
3. Review the generated job description
4. Go through each interview question
5. Use the scoring criteria to evaluate answers

### Live Interview Mode
1. Generate questions from a resume
2. Click "Start Interview Simulation"
3. Listen to the AI ask each question
4. Record your voice response or type your answer
5. Receive instant AI feedback on each response
6. Review your comprehensive interview report at the end

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Web Interface** | Streamlit |
| **AI Model** | Google Gemini 2.5 Flash |
| **PDF Parsing** | PyPDF2 |
| **Text-to-Speech** | gTTS |
| **Speech-to-Text** | AssemblyAI / Google Speech Recognition |
| **Audio Streaming** | streamlit-webrtc, LiveKit |
| **Audio Processing** | PyAV, NumPy, Wave |

## 📁 Project Structure

```
Test_AI-SystemPrompt/
├── app.py              # Main application
├── requirements.txt    # Python dependencies
├── .env                # API keys (not committed)
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🔧 How It Works

### Phase 1: Context Analysis
- Parses resume content using PyPDF2
- Identifies technical skills and experience with Gemini AI
- Generates a matching job description

### Phase 2: Question Generation
- Extracts key competencies from the resume
- Creates standardized interview questions
- Assigns difficulty levels and point values
- Provides detailed scoring rubrics

### Phase 3: Live Interview (Optional)
- Converts questions to speech using gTTS
- Records candidate responses via WebRTC/LiveKit
- Transcribes audio using AssemblyAI or fallback to Google
- Evaluates responses in real-time with Gemini AI
- Generates comprehensive interview report with hiring recommendation

## 📋 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
| `ASSEMBLYAI_API_KEY` | ❌ No | AssemblyAI API key for better transcription |
| `LIVEKIT_API_KEY` | ❌ No | LiveKit API key for advanced audio |
| `LIVEKIT_API_SECRET` | ❌ No | LiveKit API secret |
| `LIVEKIT_URL` | ❌ No | LiveKit server WebSocket URL |

## 📄 License

MIT
