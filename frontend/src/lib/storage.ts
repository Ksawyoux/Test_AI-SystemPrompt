import { Question, CandidateProfile, FitAnalysis, EvaluationResponse } from "./api";

const STORAGE_KEY = "interview_session";
const COMPLETED_INTERVIEWS_KEY = "completed_interviews";

export interface InterviewSession {
    sessionId: string;
    sessionName?: string;
    profile: CandidateProfile;
    fitAnalysis?: FitAnalysis;  // New: strengths/weaknesses analysis
    questions: Question[];
    createdAt: number;
    interviewType?: "technical" | "abstract";
    jobDescription?: string;  // Store the JD for reference
}

// Completed interview result storage
export interface InterviewResponse {
    questionIndex: number;
    question: string;
    answer: string;
    evaluation?: EvaluationResponse;
    timestamp: number;
}

export interface CompletedInterview {
    sessionId: string;
    sessionName: string;
    candidateName: string;
    candidateRole?: string;
    interviewType: "technical" | "abstract";
    jobDescription?: string;
    fitAnalysis?: FitAnalysis;
    responses: InterviewResponse[];
    violations: number;
    startedAt: number;
    completedAt: number;
    overallScore?: number;  // Calculated from response evaluations
}

// Note: Session creation is now done directly in new-simulation/page.tsx
// with all the new fields (sessionName, fitAnalysis, jobDescription)

export function getInterviewSession(): InterviewSession | null {
    if (typeof window === "undefined") return null;

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    try {
        return JSON.parse(data) as InterviewSession;
    } catch (e) {
        console.error("Failed to parse interview session", e);
        return null;
    }
}

export function clearInterviewSession() {
    if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
    }
}

// Save a completed interview
export function saveCompletedInterview(interview: CompletedInterview): void {
    if (typeof window === "undefined") return;

    const existing = getCompletedInterviews();
    existing.push(interview);
    localStorage.setItem(COMPLETED_INTERVIEWS_KEY, JSON.stringify(existing));
}

// Get all completed interviews
export function getCompletedInterviews(): CompletedInterview[] {
    if (typeof window === "undefined") return [];

    const data = localStorage.getItem(COMPLETED_INTERVIEWS_KEY);
    if (!data) return [];

    try {
        return JSON.parse(data) as CompletedInterview[];
    } catch (e) {
        console.error("Failed to parse completed interviews", e);
        return [];
    }
}

// Get a specific completed interview by session ID
export function getCompletedInterview(sessionId: string): CompletedInterview | null {
    const interviews = getCompletedInterviews();
    return interviews.find(i => i.sessionId === sessionId) || null;
}

// Delete a completed interview
export function deleteCompletedInterview(sessionId: string): void {
    if (typeof window === "undefined") return;

    const interviews = getCompletedInterviews();
    const filtered = interviews.filter(i => i.sessionId !== sessionId);
    localStorage.setItem(COMPLETED_INTERVIEWS_KEY, JSON.stringify(filtered));
}
