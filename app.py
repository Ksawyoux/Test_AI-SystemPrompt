"""
Agentic Interviewer - AI-Powered Interview Question Generator
Uses Google Gemini AI to analyze resumes and generate tailored interview questions.
"""

import streamlit as st
import google.generativeai as genai
from PyPDF2 import PdfReader
import json
import re
import csv
from io import StringIO, BytesIO
from typing import Optional, Tuple, List
import os
from dotenv import load_dotenv
import base64
import tempfile
import queue
import time

# WebRTC and Audio imports
from streamlit_webrtc import webrtc_streamer, WebRtcMode, AudioProcessorBase
import av
from gtts import gTTS
import speech_recognition as sr
import numpy as np
import wave

# LiveKit imports
from livekit import api as livekit_api
import streamlit.components.v1 as components

# Load environment variables from .env file
load_dotenv()

# --- CONSTANTS ---
MODEL_NAME = "gemini-2.5-flash"
MAX_QUESTIONS = 10

# Points per difficulty level
POINTS_RANGES = {
    "hard": (10, 15),
    "medium": (7, 10),
    "easy": (3, 7)
}

DIFFICULTY_COLORS = {
    "hard": "red",
    "medium": "orange",
    "easy": "green"
}

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


# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="Agentic Interviewer",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- CUSTOM CSS ---
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 1rem;
        margin-bottom: 2rem;
        color: white;
        text-align: center;
    }
    .main-header h1 {
        margin: 0;
        font-size: 2.5rem;
    }
    .main-header p {
        margin: 0.5rem 0 0 0;
        opacity: 0.9;
    }
</style>
""", unsafe_allow_html=True)


# --- HELPER FUNCTIONS ---
@st.cache_data
def extract_pdf_text(file_content: bytes) -> str:
    """Extract text content from a PDF file."""
    try:
        from io import BytesIO
        reader = PdfReader(BytesIO(file_content))
        text = "".join([page.extract_text() or "" for page in reader.pages])
        return text.strip()
    except Exception as e:
        st.error(f"Error reading PDF: {e}")
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
                st.warning(f"Skipped malformed row: {e}")
    
    return questions


def get_difficulty_color(difficulty: str) -> str:
    """Get color based on difficulty level."""
    return DIFFICULTY_COLORS.get(difficulty.lower(), "gray")


def display_question(q: dict, index: int) -> int:
    """Display a question card using native Streamlit components."""
    pts = q.get('max_points', 10)
    title = q.get('title', 'Topic')
    text = q.get('question_text', '...')
    diff = str(q.get('difficulty', 'Medium')).strip()
    criteria = q.get('scoring_criteria', 'No criteria provided')
    q_id = q.get('id', index + 1)
    
    # Simple color mapping
    diff_lower = diff.lower()
    if diff_lower == 'easy':
        color = 'green'
    elif diff_lower == 'hard':
        color = 'red'
    else:
        color = 'orange'
    
    # Simple layout with columns
    col1, col2 = st.columns([1, 6])
    
    with col1:
        st.markdown(f"### Q{q_id}")
        st.markdown(f":{color}[**{diff}**]")
        st.metric("Points", pts)
    
    with col2:
        st.markdown(f"**{title}**")
        st.info(text)
        with st.expander("Scoring Criteria"):
            st.write(criteria)
    
    st.divider()
    return pts


# --- LIVEKIT FUNCTIONS ---
def generate_livekit_token(room_name: str, participant_name: str) -> str:
    """Generate a LiveKit access token for a participant."""
    api_key = os.getenv("LIVEKIT_API_KEY", "")
    api_secret = os.getenv("LIVEKIT_API_SECRET", "")
    
    if not api_key or not api_secret:
        return ""
    
    try:
        token = livekit_api.AccessToken(api_key, api_secret)
        token.with_identity(participant_name)
        token.with_name(participant_name)
        token.with_grants(livekit_api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True
        ))
        return token.to_jwt()
    except Exception as e:
        st.error(f"LiveKit token error: {e}")
        return ""


def get_livekit_audio_recorder_html(livekit_url: str, token: str, question_num: int) -> str:
    """Generate HTML component for LiveKit audio recording."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js"></script>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 10px; }}
            .recording {{ color: #e74c3c; animation: pulse 1s infinite; }}
            @keyframes pulse {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.5; }} }}
            button {{ 
                padding: 12px 24px; 
                margin: 5px; 
                border: none; 
                border-radius: 8px; 
                cursor: pointer; 
                font-size: 16px;
            }}
            .start {{ background: #27ae60; color: white; }}
            .stop {{ background: #e74c3c; color: white; }}
            .status {{ margin: 10px 0; padding: 10px; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div id="status" class="status">🎙️ Click Start to begin recording</div>
        
        <button class="start" onclick="startRecording()">🎤 Start Recording</button>
        <button class="stop" onclick="stopRecording()" disabled id="stopBtn">⏹️ Stop Recording</button>
        
        <audio id="audioPlayback" controls style="display:none; margin-top:10px; width:100%;"></audio>
        
        <script>
            let mediaRecorder;
            let audioChunks = [];
            let stream;
            
            async function startRecording() {{
                try {{
                    stream = await navigator.mediaDevices.getUserMedia({{ audio: true }});
                    mediaRecorder = new MediaRecorder(stream, {{ mimeType: 'audio/webm' }});
                    audioChunks = [];
                    
                    mediaRecorder.ondataavailable = (event) => {{
                        audioChunks.push(event.data);
                    }};
                    
                    mediaRecorder.onstop = async () => {{
                        const audioBlob = new Blob(audioChunks, {{ type: 'audio/webm' }});
                        const audioUrl = URL.createObjectURL(audioBlob);
                        document.getElementById('audioPlayback').src = audioUrl;
                        document.getElementById('audioPlayback').style.display = 'block';
                        
                        // Convert to base64 and send to Streamlit
                        const reader = new FileReader();
                        reader.onloadend = () => {{
                            const base64Audio = reader.result.split(',')[1];
                            // Store in session storage for retrieval
                            sessionStorage.setItem('livekit_audio_q{question_num}', base64Audio);
                            document.getElementById('status').innerHTML = '✅ Recording saved! Click Submit Voice Response.';
                        }};
                        reader.readAsDataURL(audioBlob);
                    }};
                    
                    mediaRecorder.start();
                    document.getElementById('status').innerHTML = '<span class="recording">🔴 Recording...</span> Speak now!';
                    document.getElementById('stopBtn').disabled = false;
                    
                }} catch(err) {{
                    document.getElementById('status').innerHTML = '❌ Microphone access denied: ' + err.message;
                }}
            }}
            
            function stopRecording() {{
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {{
                    mediaRecorder.stop();
                    stream.getTracks().forEach(track => track.stop());
                    document.getElementById('stopBtn').disabled = true;
                }}
            }}
        </script>
    </body>
    </html>
    """


def check_livekit_configured() -> bool:
    """Check if LiveKit credentials are configured."""
    return bool(os.getenv("LIVEKIT_API_KEY")) and bool(os.getenv("LIVEKIT_API_SECRET"))


# --- INTERVIEW SIMULATION FUNCTIONS ---
class AudioRecorder(AudioProcessorBase):
    """Process and record audio frames from WebRTC for speech recognition."""
    
    def __init__(self):
        self.audio_frames = []
        self.sample_rate = 48000
        self.is_recording = True
        
    def recv(self, frame: av.AudioFrame) -> av.AudioFrame:
        """Receive audio frames and store them."""
        if self.is_recording:
            audio_array = frame.to_ndarray()
            self.audio_frames.append(audio_array)
        return frame
    
    def get_audio_data(self):
        """Get all recorded audio as a single numpy array."""
        import numpy as np  # Import here for thread safety
        if self.audio_frames:
            return np.concatenate(self.audio_frames, axis=1)
        return None
    
    def clear(self):
        """Clear recorded audio."""
        self.audio_frames = []


def save_audio_to_wav(audio_data, sample_rate: int = 48000) -> bytes:
    """Convert numpy audio array to WAV bytes."""
    try:
        if audio_data.ndim > 1:
            audio_data = audio_data.flatten()
        
        audio_data = audio_data.astype(np.float32)
        max_val = np.max(np.abs(audio_data))
        if max_val > 0:
            audio_data = audio_data / max_val
        audio_int16 = (audio_data * 32767).astype(np.int16)
        
        buffer = BytesIO()
        with wave.open(buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_int16.tobytes())
        
        buffer.seek(0)
        return buffer.read()
    except Exception as e:
        st.error(f"Error converting audio: {e}")
        return b""


def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe audio bytes to text using AssemblyAI (preferred) or Google Speech Recognition."""
    
    # Try AssemblyAI first (very accurate)
    assemblyai_key = os.getenv("ASSEMBLYAI_API_KEY", "")
    
    if assemblyai_key:
        try:
            import assemblyai as aai
            
            aai.settings.api_key = assemblyai_key
            
            # Save audio to temp file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                tmp_file.write(audio_bytes)
                tmp_path = tmp_file.name
            
            try:
                transcriber = aai.Transcriber()
                transcript = transcriber.transcribe(tmp_path)
                
                if transcript.status == aai.TranscriptStatus.error:
                    return f"[Transcription error: {transcript.error}]"
                
                if transcript.text:
                    return transcript.text
                else:
                    return "[No speech detected - please try again]"
            finally:
                os.unlink(tmp_path)
                
        except Exception as e:
            st.warning(f"AssemblyAI error, falling back to Google: {e}")
    
    # Fallback to Google Speech Recognition
    recognizer = sr.Recognizer()
    
    try:
        audio_buffer = BytesIO(audio_bytes)
        with sr.AudioFile(audio_buffer) as source:
            audio_data = recognizer.record(source)
        
        text = recognizer.recognize_google(audio_data)
        return text
    except sr.UnknownValueError:
        return "[Could not understand audio - please try again]"
    except sr.RequestError as e:
        return f"[Speech recognition error: {e}]"
    except Exception as e:
        return f"[Error: {e}]"


def text_to_speech(text: str) -> bytes:
    """Convert text to speech using gTTS."""
    try:
        tts = gTTS(text=text, lang='en', slow=False)
        audio_buffer = BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        return audio_buffer.read()
    except Exception as e:
        st.error(f"TTS Error: {e}")
        return b""


def get_audio_player_html(audio_bytes: bytes, autoplay: bool = True) -> str:
    """Generate HTML audio player with optional autoplay."""
    b64_audio = base64.b64encode(audio_bytes).decode()
    autoplay_attr = "autoplay" if autoplay else ""
    return f"""
    <audio {autoplay_attr} controls style="display:none;">
        <source src="data:audio/mp3;base64,{b64_audio}" type="audio/mp3">
    </audio>
    """


def evaluate_single_response(
    model: genai.GenerativeModel,
    question: dict,
    response: str
) -> dict:
    """Evaluate a single interview response using Gemini."""
    
    prompt = f"""
You are an expert technical interviewer evaluating a candidate's response.

QUESTION:
Title: {question.get('title', 'Unknown')}
Question: {question.get('question_text', '')}
Difficulty: {question.get('difficulty', 'Medium')}
Max Points: {question.get('max_points', 10)}
Scoring Criteria: {question.get('scoring_criteria', 'Evaluate for accuracy and depth')}

CANDIDATE'S RESPONSE:
"{response}"

TASK:
Evaluate the response and provide:
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


def display_interview_report(report: dict) -> None:
    """Display the interview report in a styled format."""
    
    st.markdown("## 📊 Interview Report")
    st.divider()
    
    # Score Overview
    percentage = report.get('percentage', 0)
    score_color = "green" if percentage >= 70 else "orange" if percentage >= 50 else "red"
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(
            "Total Score",
            f"{report.get('overall_score', 0)}/{report.get('max_score', 100)}",
            f"{percentage}%"
        )
    with col2:
        hiring_rec = report.get('hiring_recommendation', 'N/A')
        rec_emoji = {"Strong Hire": "🌟", "Hire": "✅", "Maybe": "🤔", "No Hire": "❌"}.get(hiring_rec, "📋")
        st.metric("Recommendation", f"{rec_emoji} {hiring_rec}")
    with col3:
        st.metric("Questions Answered", len(report.get('strengths', [])) + len(report.get('weaknesses', [])))
    
    st.divider()
    
    # Overall Assessment
    st.markdown("### 📝 Overall Assessment")
    st.info(report.get('overall_assessment', 'No assessment available'))
    
    # Strengths and Weaknesses side by side
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### ✅ Strengths")
        for strength in report.get('strengths', []):
            st.markdown(f"- {strength}")
    
    with col2:
        st.markdown("### ⚠️ Areas for Improvement")
        for weakness in report.get('weaknesses', []):
            st.markdown(f"- {weakness}")
    
    st.divider()
    
    # Recommendations
    st.markdown("### 💡 Recommendations")
    for i, rec in enumerate(report.get('recommendations', []), 1):
        st.markdown(f"**{i}.** {rec}")
    
    st.divider()
    
    # Hiring Rationale
    st.markdown("### 🎯 Hiring Rationale")
    st.success(report.get('hiring_rationale', 'No rationale provided'))


def run_interview_simulation(
    questions: List[dict],
    api_key: str,
    candidate_profile: Optional[dict] = None
) -> None:
    """Run the interactive interview simulation."""
    
    # Initialize session state for interview
    if 'interview_state' not in st.session_state:
        st.session_state.interview_state = {
            'current_question': 0,
            'responses': [],
            'evaluations': [],
            'is_active': True,
            'is_complete': False,
            'awaiting_response': True
        }
    
    state = st.session_state.interview_state
    
    # Check if interview is complete
    if state['is_complete']:
        # Generate and display report
        if 'final_report' not in st.session_state:
            with st.spinner("Generating interview report..."):
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(MODEL_NAME)
                st.session_state.final_report = generate_interview_report(
                    model, questions, state['evaluations'], candidate_profile
                )
        
        display_interview_report(st.session_state.final_report)
        
        # Reset button
        if st.button("🔄 Start New Interview", type="primary"):
            del st.session_state.interview_state
            if 'final_report' in st.session_state:
                del st.session_state.final_report
            st.rerun()
        return
    
    current_idx = state['current_question']
    current_q = questions[current_idx]
    
    # Header
    st.markdown("## 🎤 Live Interview Simulation")
    
    # Progress bar
    progress = (current_idx) / len(questions)
    st.progress(progress, text=f"Question {current_idx + 1} of {len(questions)}")
    
    st.divider()
    
    # Current Question Display
    col1, col2 = st.columns([3, 1])
    with col1:
        st.markdown(f"### Question {current_idx + 1}: {current_q.get('title', 'Topic')}")
        difficulty = current_q.get('difficulty', 'Medium')
        diff_color = {"Easy": "green", "Medium": "orange", "Hard": "red"}.get(difficulty, "gray")
        st.markdown(f":{diff_color}[**{difficulty}**] • {current_q.get('max_points', 10)} points")
    
    with col2:
        st.metric("Points Available", current_q.get('max_points', 10))
    
    # Display the question
    st.info(f"**{current_q.get('question_text', '')}**")
    
    # Play question audio
    if state['awaiting_response']:
        question_text = current_q.get('question_text', '')
        with st.spinner("🔊 AI is asking the question..."):
            audio_bytes = text_to_speech(f"Question {current_idx + 1}. {question_text}")
            if audio_bytes:
                st.audio(audio_bytes, format='audio/mp3', autoplay=True)
        state['awaiting_response'] = False
    
    st.divider()
    
    # Response Input Section
    st.markdown("### 💬 Your Response")
    
    # Tabs for different input methods
    tab1, tab2 = st.tabs(["🎙️ Voice Response (LiveKit)", "⌨️ Type Response"])
    
    with tab1:
        st.markdown("**🎤 Record your spoken response with LiveKit:**")
        
        # Check if LiveKit is configured
        livekit_url = os.getenv("LIVEKIT_URL", "")
        
        if check_livekit_configured() and livekit_url:
            # Generate token and show LiveKit recorder
            token = generate_livekit_token(f"interview_{current_idx}", "candidate")
            
            # Embed LiveKit audio recorder
            components.html(
                get_livekit_audio_recorder_html(livekit_url, token, current_idx),
                height=200
            )
            
            st.caption("💡 After recording, paste your transcribed response below or use the text tab")
        else:
            # Fallback: Use simple HTML5 audio recorder without LiveKit server
            st.info("💡 Using browser-based audio recording (LiveKit not configured)")
            
            simple_recorder_html = f"""
            <div style="font-family: -apple-system, sans-serif; padding: 10px;">
                <div id="status" style="margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">
                    🎙️ Click Start to begin recording
                </div>
                <button onclick="startRec()" style="padding: 12px 24px; background: #27ae60; color: white; border: none; border-radius: 8px; margin: 5px; cursor: pointer;">
                    🎤 Start Recording
                </button>
                <button onclick="stopRec()" id="stopBtn" disabled style="padding: 12px 24px; background: #e74c3c; color: white; border: none; border-radius: 8px; margin: 5px; cursor: pointer;">
                    ⏹️ Stop Recording
                </button>
                <audio id="audio" controls style="display:none; margin-top:10px; width:100%;"></audio>
                <textarea id="transcript" style="display:none; width:100%; height:80px; margin-top:10px;" placeholder="Transcription will appear here..."></textarea>
                
                <script>
                let rec, chunks = [], stream;
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                let recognition = SpeechRecognition ? new SpeechRecognition() : null;
                let finalTranscript = '';
                
                if (recognition) {{
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = 'en-US';
                    
                    recognition.onresult = (e) => {{
                        let interim = '';
                        for (let i = e.resultIndex; i < e.results.length; i++) {{
                            if (e.results[i].isFinal) {{
                                finalTranscript += e.results[i][0].transcript + ' ';
                            }} else {{
                                interim += e.results[i][0].transcript;
                            }}
                        }}
                        document.getElementById('transcript').value = finalTranscript + interim;
                        document.getElementById('transcript').style.display = 'block';
                    }};
                }}
                
                async function startRec() {{
                    try {{
                        stream = await navigator.mediaDevices.getUserMedia({{audio: true}});
                        rec = new MediaRecorder(stream);
                        chunks = [];
                        finalTranscript = '';
                        
                        rec.ondataavailable = e => chunks.push(e.data);
                        rec.onstop = () => {{
                            const blob = new Blob(chunks, {{type: 'audio/webm'}});
                            document.getElementById('audio').src = URL.createObjectURL(blob);
                            document.getElementById('audio').style.display = 'block';
                            document.getElementById('status').innerHTML = '✅ Recording complete! Copy the transcript below.';
                        }};
                        
                        rec.start();
                        if (recognition) recognition.start();
                        
                        document.getElementById('status').innerHTML = '<span style="color:#e74c3c;">🔴 Recording...</span> Speak now!';
                        document.getElementById('stopBtn').disabled = false;
                    }} catch(e) {{
                        document.getElementById('status').innerHTML = '❌ Error: ' + e.message;
                    }}
                }}
                
                function stopRec() {{
                    if (rec && rec.state !== 'inactive') {{
                        rec.stop();
                        stream.getTracks().forEach(t => t.stop());
                        if (recognition) recognition.stop();
                        document.getElementById('stopBtn').disabled = true;
                    }}
                }}
                </script>
            </div>
            """
            
            components.html(simple_recorder_html, height=280)
        
        # Text area for transcription (for pasting or editing)
        voice_transcript = st.text_area(
            "📝 Voice Transcription (paste or edit here):",
            height=100,
            key=f"voice_transcript_{current_idx}",
            placeholder="After recording, paste or type your transcribed response here..."
        )
        
        # Submit voice response
        if st.button("📤 Submit Voice Response", key=f"voice_submit_{current_idx}", type="primary"):
            if voice_transcript.strip():
                with st.spinner("🤖 AI is evaluating your response..."):
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel(MODEL_NAME)
                    evaluation = evaluate_single_response(model, current_q, voice_transcript.strip())
                    evaluation['response'] = voice_transcript.strip()
                    
                    state['responses'].append(voice_transcript.strip())
                    state['evaluations'].append(evaluation)
                
                st.success(f"Score: {evaluation.get('score', 0)}/{evaluation.get('max_points', 10)}")
                st.info(f"💪 {evaluation.get('feedback_positive', '')}")
                
                if current_idx + 1 < len(questions):
                    state['current_question'] += 1
                    state['awaiting_response'] = True
                    time.sleep(2)
                    st.rerun()
                else:
                    state['is_complete'] = True
                    st.rerun()
            else:
                st.warning("⚠️ Please paste or type your transcribed response above.")
    
    with tab2:
        response_text = st.text_area(
            "Type your answer here:",
            height=150,
            key=f"text_response_{current_idx}",
            placeholder="Enter your response to the interview question..."
        )
        
        col1, col2, col3 = st.columns([1, 1, 2])
        
        with col1:
            if st.button("📤 Submit Response", type="primary", key=f"submit_{current_idx}"):
                if response_text.strip():
                    # Evaluate response
                    with st.spinner("🤖 AI is evaluating your response..."):
                        genai.configure(api_key=api_key)
                        model = genai.GenerativeModel(MODEL_NAME)
                        evaluation = evaluate_single_response(model, current_q, response_text)
                        evaluation['response'] = response_text
                        
                        state['responses'].append(response_text)
                        state['evaluations'].append(evaluation)
                    
                    # Show quick feedback
                    st.success(f"Score: {evaluation.get('score', 0)}/{evaluation.get('max_points', 10)}")
                    st.info(f"💪 {evaluation.get('feedback_positive', '')}")
                    
                    # Move to next question
                    if current_idx + 1 < len(questions):
                        state['current_question'] += 1
                        state['awaiting_response'] = True
                        time.sleep(2)  # Brief pause to show feedback
                        st.rerun()
                    else:
                        state['is_complete'] = True
                        st.rerun()
                else:
                    st.error("Please enter a response before submitting.")
        
        with col2:
            if st.button("⏭️ Skip Question", key=f"skip_{current_idx}"):
                state['responses'].append("[SKIPPED]")
                state['evaluations'].append({
                    'response': '[SKIPPED]',
                    'score': 0,
                    'max_points': current_q.get('max_points', 10),
                    'feedback_positive': 'Question was skipped',
                    'feedback_improvement': 'Consider answering all questions'
                })
                
                if current_idx + 1 < len(questions):
                    state['current_question'] += 1
                    state['awaiting_response'] = True
                    st.rerun()
                else:
                    state['is_complete'] = True
                    st.rerun()
    
    st.divider()
    
    # End Interview Button
    if st.button("🛑 End Interview Early", type="secondary"):
        # Mark remaining questions as skipped
        for i in range(current_idx, len(questions)):
            if i >= len(state['responses']):
                state['responses'].append("[NOT ANSWERED]")
                state['evaluations'].append({
                    'response': '[NOT ANSWERED]',
                    'score': 0,
                    'max_points': questions[i].get('max_points', 10),
                    'feedback_positive': 'Interview ended early',
                    'feedback_improvement': 'Question was not answered'
                })
        state['is_complete'] = True
        st.rerun()


# --- AI CHAIN FUNCTIONS ---
def run_candidate_profile_extraction(
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
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except json.JSONDecodeError as e:
        st.error(f"Failed to parse profile data: {e}")
        return None
    except Exception as e:
        st.error(f"Profile extraction failed: {e}")
        return None


def display_candidate_profile(profile: dict) -> None:
    """Display the candidate profile in a styled card."""
    st.markdown("### 👤 Candidate Profile")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**💼 Current Role**")
        st.info(profile.get('current_role', 'Not found'))
        
        st.markdown("**📍 Location**")
        st.info(profile.get('location', 'Not found'))
    
    with col2:
        st.markdown("**🎓 Educational Level**")
        st.info(profile.get('educational_level', 'Not found'))
        
        st.markdown("**⏱️ Total Experience**")
        years = profile.get('experience_years', 0)
        st.info(f"{years} years")
    
    # Show experience breakdown in expander
    breakdown = profile.get('experience_breakdown', '')
    if breakdown:
        with st.expander("📊 Experience Calculation Details"):
            st.write(breakdown)


def run_context_analysis(
    model: genai.GenerativeModel,
    resume_text: str
) -> Optional[dict]:
    """Phase 1: Analyze resume and generate context."""
    
    prompt = f"""
You are a Senior HR Analyst with expertise in technical recruiting.

INPUTS:
- RESUME: {resume_text}
- JD TEMPLATE: {JD_TEMPLATE}

TASK:
1. Analyze the candidate's persona based on their resume (skills, experience level, domain expertise).
2. Generate a generalized job description that matches their profile.
3. Create a campaign context summarizing the interview focus areas.
4. Do NOT describe the candidate.
5. Instead, describe the **skills and scenarios** that must be simulated to test a person for these roles.
6. Phrasing should be: "To simulate this job, the candidate must demonstrate..."

OUTPUT (JSON only, no markdown):
{{
    "campaign_context": "Brief summary of interview focus areas and the candidate general persona",
    "job_description": "Full markdown-formatted job description"
}}
"""
    
    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except json.JSONDecodeError as e:
        st.error(f"Failed to parse AI response: {e}")
        return None
    except Exception as e:
        st.error(f"Context analysis failed: {e}")
        return None


def run_question_generation(
    model: genai.GenerativeModel,
    context_data: dict
) -> list[dict]:
    """Phase 2: Generate interview questions."""
    
    prompt = f"""
You are an Expert Technical Interviewer.
Your goal is to create interview questions based on the core technical competencies required for a role.

INPUT CONTEXT:
{context_data.get('campaign_context', '')}
{context_data.get('job_description', '')}

INSTRUCTIONS:
1. Analyze the input to identify the key technical skills required.
2. Generalize these skills (e.g., if the resume says "Project Apollo API", use "RESTful API Design").
3. Generate exactly {MAX_QUESTIONS} interview questions covering distinct technical topics.
4. Include a mix of "Easy", "Medium", and "Hard" difficulty levels.
5. SCORING RULES:
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
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(response.text)
        questions = data.get("questions", [])
        
        if not questions:
            st.warning("No questions generated. Raw AI output:")
            st.code(response.text, language="json")
        
        return questions
    except json.JSONDecodeError as e:
        st.error(f"Failed to parse AI response: {e}")
        st.code(response.text, language="text")
        return []
    except Exception as e:
        st.error(f"Question generation failed: {e}")
        return []


def run_agentic_chain(
    resume_text: str,
    api_key: str
) -> Tuple[Optional[dict], Optional[dict], list[dict]]:
    """Execute the full agentic interview generation chain.
    
    Returns:
        Tuple of (candidate_profile, context_data, questions)
    """
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL_NAME)
    except Exception as e:
        st.error(f"Failed to initialize Gemini: {e}")
        return None, None, []
    
    # Phase 1: Candidate Profile Extraction
    with st.status("👤 Phase 1: Extracting Candidate Profile...", expanded=True) as status:
        st.write("Parsing resume for candidate information...")
        st.write("Calculating total experience...")
        
        candidate_profile = run_candidate_profile_extraction(model, resume_text)
        
        if candidate_profile:
            status.update(label="✅ Phase 1 Complete", state="complete", expanded=False)
        else:
            status.update(label="⚠️ Phase 1 Partial (continuing...)", state="complete", expanded=False)
    
    # Phase 2: Context Analysis
    with st.status("🔍 Phase 2: Analyzing Resume & Context...", expanded=True) as status:
        st.write("Analyzing candidate persona...")
        st.write("Generating job description...")
        
        context_data = run_context_analysis(model, resume_text)
        
        if context_data:
            status.update(label="✅ Phase 2 Complete", state="complete", expanded=False)
        else:
            status.update(label="❌ Phase 2 Failed", state="error")
            return candidate_profile, None, []
    
    # Phase 3: Question Generation
    with st.status("📝 Phase 3: Generating Interview Questions...", expanded=True) as status:
        st.write(f"Creating {MAX_QUESTIONS} tailored questions...")
        st.write("Applying scoring criteria...")
        
        questions = run_question_generation(model, context_data)
        
        if questions:
            status.update(
                label=f"✅ Phase 3 Complete ({len(questions)} questions)",
                state="complete",
                expanded=False
            )
        else:
            status.update(label="❌ Phase 3 Failed", state="error")
    
    return candidate_profile, context_data, questions


# --- SIDEBAR ---
with st.sidebar:
    st.header("⚙️ Settings")
    
    # Get API key from environment or user input
    env_api_key = os.getenv("GEMINI_API_KEY", "")
    
    if env_api_key:
        st.success("✅ API Key loaded from .env")
        api_key = env_api_key
    else:
        api_key = st.text_input(
            "Gemini API Key",
            type="password",
            help="Enter your Google Gemini API key"
        )
        if not api_key:
            st.info("💡 Add `GEMINI_API_KEY=your_key` to .env file")
    
    st.divider()
    
    st.markdown("### 📊 Model Info")
    st.markdown(f"**Model:** `{MODEL_NAME}`")
    st.markdown(f"**Questions:** {MAX_QUESTIONS}")
    st.markdown("**Scoring:** Easy 3-7, Medium 7-10, Hard 10-15")
    
    st.divider()
    
    st.markdown("### 📖 How to Use")
    st.markdown("""
    1. Upload a PDF resume
    2. Wait for AI analysis
    3. Review generated questions
    4. Use scoring guides for evaluation
    """)


# --- MAIN CONTENT ---
st.markdown("""
<div class="main-header">
    <h1>🎯 Agentic Interviewer</h1>
    <p>AI-powered interview question generator using Google Gemini</p>
</div>
""", unsafe_allow_html=True)

# File uploader
uploaded_file = st.file_uploader(
    "📄 Upload Resume (PDF)",
    type=["pdf"],
    help="Upload a candidate's resume to generate tailored interview questions"
)

# Process resume
if uploaded_file and api_key:
    # Use session state to cache results
    file_key = f"results_{uploaded_file.name}"
    
    if file_key not in st.session_state:
        resume_text = extract_pdf_text(uploaded_file.read())
        
        if resume_text:
            with st.spinner("Processing..."):
                profile, context, questions = run_agentic_chain(resume_text, api_key)
                st.session_state[file_key] = {
                    "profile": profile,
                    "context": context,
                    "questions": questions
                }
        else:
            st.error("Could not extract text from PDF. Please try another file.")
            st.stop()
    
    # Get cached results
    cached = st.session_state.get(file_key, {})
    profile = cached.get("profile")
    context = cached.get("context")
    questions = cached.get("questions", [])
    
    if context and questions:
        # Display results
        st.divider()
        
        # Candidate Profile (New Feature)
        if profile:
            display_candidate_profile(profile)
            st.divider()
        
        # Check if we're in interview simulation mode
        if st.session_state.get('interview_mode', False):
            # Run the interview simulation
            run_interview_simulation(questions, api_key, profile)
            
            # Back to questions button (only show if interview not started)
            if 'interview_state' not in st.session_state:
                if st.button("⬅️ Back to Questions"):
                    st.session_state.interview_mode = False
                    st.rerun()
        else:
            # Normal questions view
            # Job Description
            with st.expander("📄 Generated Job Description", expanded=False):
                st.markdown(context.get('job_description', 'No description available'))
            
            # Campaign Context
            with st.expander("🎯 Campaign Context", expanded=False):
                st.info(context.get('campaign_context', 'No context available'))
            
            st.divider()
            
            # Questions Header with Actions
            col1, col2, col3 = st.columns([2, 1, 1])
            with col1:
                st.subheader(f"📝 Interview Questions ({len(questions)})")
            with col2:
                if st.button("🎤 Simulate Interview", type="primary", help="Start AI-powered interview simulation"):
                    st.session_state.interview_mode = True
                    # Clear any previous interview state
                    if 'interview_state' in st.session_state:
                        del st.session_state.interview_state
                    if 'final_report' in st.session_state:
                        del st.session_state.final_report
                    st.rerun()
            with col3:
                if st.button("🔄 Regenerate", help="Generate new questions"):
                    if file_key in st.session_state:
                        del st.session_state[file_key]
                    st.rerun()
            
            # Display questions
            total_score = 0
            for idx, q in enumerate(questions):
                total_score += display_question(q, idx)
            
            # Summary
            st.success(f"📊 **Total Exam Score: {total_score}/100 points**")
            
            # Simulate Interview CTA at the bottom
            st.divider()
            st.markdown("### 🚀 Ready to Practice?")
            st.markdown("Start an AI-powered mock interview where you'll answer each question verbally or by typing.")
            if st.button("🎤 Start Interview Simulation", key="start_interview_bottom", type="primary"):
                st.session_state.interview_mode = True
                if 'interview_state' in st.session_state:
                    del st.session_state.interview_state
                if 'final_report' in st.session_state:
                    del st.session_state.final_report
                st.rerun()

elif uploaded_file and not api_key:
    st.warning("⚠️ Please provide a Gemini API key in the sidebar or .env file")

else:
    # Simple welcome message
    st.markdown("""
    ### 👋 Welcome!
    
    Upload a PDF resume to get started. The AI will:
    
    1. **Analyze** the candidate's profile
    2. **Generate** a tailored job description
    3. **Create** 10 interview questions with scoring
    
    **Total: 100 points** 💯
    """)