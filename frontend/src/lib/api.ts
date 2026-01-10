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

// Sanitize URL to remove trailing slash
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
console.log("🚀 Configured API URL:", API_BASE_URL);

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
    interviewType: string = "technical",
    questionCount: number = 5
): Promise<ResumeAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);
    formData.append('interview_type', interviewType);
    formData.append('question_count', questionCount.toString());

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
    sessionName?: string,     // Optional session name for display
    userId?: string           // User ID for data isolation
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
            user_id: userId,
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
    sessionName?: string,
    userId?: string
): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/save-session-analysis`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: sessionId,
            fit_analysis: fitAnalysis,
            session_name: sessionName,
            user_id: userId
        }),
    });

    if (!response.ok) {
        console.error('Failed to save session analysis');
        // Don't throw to avoid blocking the interview flow
    }
}

export interface SessionAnalysis {
    session_id: string;
    fit_analysis: FitAnalysis;
    session_name?: string;
    user_id?: string;
    created_at?: string;
}

export async function getSessionAnalysis(
    sessionId: string,
    userId?: string
): Promise<SessionAnalysis | null> {
    try {
        const url = new URL(`${API_BASE_URL}/api/session-analysis/${sessionId}`);
        if (userId) {
            url.searchParams.append('user_id', userId);
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to get session analysis:', error);
        return null;
    }
}

export async function generateReport(
    questions: Question[],
    evaluations: QuestionEvaluation[],
    candidateProfile?: CandidateProfile,
    fitAnalysis?: FitAnalysis
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
            fit_analysis: fitAnalysis,
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
    technical_score?: number;
    communication_score?: number;
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

export async function getDashboardStats(userId?: string): Promise<DashboardStats> {
    const url = userId
        ? `${API_BASE_URL}/api/dashboard-stats?user_id=${encodeURIComponent(userId)}`
        : `${API_BASE_URL}/api/dashboard-stats`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
    }
    return response.json();
}

// Report Query (Ask AI Assistant)
export interface ReportQueryResponse {
    answer: string;
    confidence_level: string;
    relevant_quotes: string[];
    source_trace: string;
}

export async function queryReport(
    reportData: FitAnalysis | InterviewReport,
    userQuestion: string
): Promise<ReportQueryResponse> {
    const response = await fetch(`${API_BASE_URL}/api/query-report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            report_data: reportData,
            user_question: userQuestion,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to query report');
    }

    return response.json();
}

// AI Coach Recommendations (2-Step Analysis)
export interface AIRecommendation {
    category: string;
    content: string;
}

export interface AIRecommendationsResponse {
    gaps_analysis: {
        omitted_technical_concepts: string[];
        generic_phrases_detected: string[];
        missing_data_points: string[];
    };
    recommendations: AIRecommendation[];
    confidence_score: number;
    gaps_summary: string;
}

export async function getAIRecommendations(
    candidateTranscript: string,
    sourceReport: Record<string, unknown>
): Promise<AIRecommendationsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/ai-recommendations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            candidate_transcript: candidateTranscript,
            source_report: sourceReport,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get AI recommendations');
    }

    return response.json();
}
