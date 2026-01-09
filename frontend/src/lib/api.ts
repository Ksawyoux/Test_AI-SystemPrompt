export interface CandidateProfile {
    current_role: string;
    location: string;
    educational_level: string;
    experience_years: number;
    experience_breakdown: string;
}

export interface CampaignContext {
    campaign_context: string;
    job_description: string;
}

// New: Fit analysis comparing resume to job description
export interface FitAnalysis {
    strengths: string[];
    weaknesses: string[];
    fit_score: number;
    summary: string;
}

export interface Question {
    id: number;
    title: string;
    question_text: string;
    difficulty: string;
    max_points: number;
    scoring_criteria: string;
}

export interface ResumeAnalysisResponse {
    profile: CandidateProfile;
    fit_analysis: FitAnalysis;  // Changed from context
    questions: Question[];
}

export interface EvaluationResponse {
    score: number;
    max_points: number;
    feedback_positive: string;
    feedback_improvement: string;
    response?: string; // Echoed back
    conversational_response?: string;
}

export interface InterviewReport {
    overall_score: number;
    max_score: number;
    percentage: number;
    overall_assessment: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    hiring_recommendation: string;
    hiring_rationale: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ... existing imports ...

export async function getLiveKitToken(roomName: string, participantName: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/get-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room_name: roomName, participant_name: participantName }),
    });

    if (!response.ok) {
        throw new Error('Failed to get LiveKit token');
    }

    const data = await response.json();
    return data.token;
}

export async function analyzeResume(
    file: File,
    jobDescription: string,
    interviewType: string = "technical"
): Promise<ResumeAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);
    formData.append('interview_type', interviewType);

    const response = await fetch(`${API_BASE_URL}/api/analyze-resume`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to analyze resume');
    }

    return response.json();
}

export async function evaluateResponse(
    question: Question,
    responseText: string,
    sessionId?: string,
    codeSubmission?: string,  // Optional code from the editor
    sessionName?: string      // Optional session name for display
): Promise<EvaluationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/evaluate-response`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question,
            response_text: responseText,
            session_id: sessionId,
            code_submission: codeSubmission,
            session_name: sessionName,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to evaluate response');
    }

    return response.json();
}

export interface QuestionEvaluation extends EvaluationResponse {
    question_text: string;
    title: string;
    difficulty: string;
}

export async function saveSessionAnalysis(
    sessionId: string,
    fitAnalysis: any,
    sessionName?: string
): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/save-session-analysis`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: sessionId,
            fit_analysis: fitAnalysis,
            session_name: sessionName
        }),
    });

    if (!response.ok) {
        console.error('Failed to save session analysis');
        // Don't throw to avoid blocking the interview flow
    }
}

export async function generateReport(
    questions: Question[],
    evaluations: QuestionEvaluation[],
    candidateProfile?: CandidateProfile
): Promise<InterviewReport> {

    // Transform evaluations to match backend expected format if needed
    // The backend expects List[QuestionEvaluation], which is effectively the same as what we have

    const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            questions,
            evaluations,
            candidate_profile: candidateProfile,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate report');
    }

    return response.json();
}

// D-ID API
export interface DIDTalkResponse {
    id: string;
    status: string;
    result_url: string | null;
}

export async function createDIDTalk(text: string, voiceId: string = "en-US-JennyNeural"): Promise<DIDTalkResponse> {
    const response = await fetch(`${API_BASE_URL}/api/did/create-talk`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
            voice_id: voiceId,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create D-ID talk');
    }

    return response.json();
}

// Dashboard Stats
export interface RecentInterview {
    id: string;
    role: string;
    score: number;
    date: string;
    raw_date?: string;
}

export interface PerformanceDataPoint {
    name: string;
    score: number;
    date: string;
}

export interface Recommendation {
    category: string;
    content: string;
}

export interface DashboardStats {
    recent_interviews: RecentInterview[];
    performance_data: PerformanceDataPoint[];
    recommendations: Recommendation[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard-stats`);
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
    }
    return response.json();
}
