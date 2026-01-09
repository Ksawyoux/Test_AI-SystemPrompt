"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    FileText, CheckCircle2, ArrowRight, Target, BrainCircuit,
    Code, Lightbulb, Upload, Briefcase, TrendingUp, TrendingDown,
    Sparkles, AlertCircle
} from "lucide-react";
import { analyzeResume, ResumeAnalysisResponse } from "@/lib/api";

const STEPS = [
    { id: 1, title: "Job Description", icon: Briefcase },
    { id: 2, title: "Upload Resume", icon: Upload },
    { id: 3, title: "Interview Type", icon: Lightbulb },
    { id: 4, title: "AI Analysis", icon: BrainCircuit },
    { id: 5, title: "Review & Start", icon: Target },
];

export default function NewSimulationPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [jobDescription, setJobDescription] = useState("");
    const [interviewType, setInterviewType] = useState<"technical" | "abstract">("technical");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleJDSubmit = () => {
        if (jobDescription.trim().length < 50) {
            setError("Please provide a detailed job description (at least 50 characters).");
            return;
        }
        setError(null);
        setCurrentStep(2);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== 'application/pdf') {
            setError("File must be a PDF.");
            return;
        }

        setFile(selectedFile);
        setError(null);
        setCurrentStep(3);
    };

    const handleTypeSelect = async (type: "technical" | "abstract") => {
        setInterviewType(type);
        setCurrentStep(4);
        await performAnalysis(type);
    };

    const performAnalysis = async (type: string) => {
        if (!file || !jobDescription) return;

        setIsAnalyzing(true);
        try {
            const result = await analyzeResume(file, jobDescription, type);
            setAnalysisResult(result);
            setIsAnalyzing(false);
            setCurrentStep(5);
        } catch (err: any) {
            setError(err.message || "Error during analysis.");
            setIsAnalyzing(false);
            setCurrentStep(1);
        }
    };

    const startSimulation = () => {
        if (!analysisResult) return;

        const sessionName = analysisResult.profile?.current_role
            ? `${analysisResult.profile.current_role} Interview`
            : `${interviewType === 'technical' ? 'Technical' : 'Behavioral'} Interview`;

        const sessionId = crypto.randomUUID();
        const session = {
            sessionId,
            sessionName,
            profile: analysisResult.profile,
            fitAnalysis: analysisResult.fit_analysis,
            questions: analysisResult.questions,
            createdAt: Date.now(),
            interviewType: interviewType,
            jobDescription: jobDescription
        };
        localStorage.setItem("interview_session", JSON.stringify(session));

        router.push("/dashboard/simulation");
    };

    const getFitScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        return "text-red-500";
    };

    const getFitScoreBg = (score: number) => {
        if (score >= 80) return "bg-green-500/20";
        if (score >= 60) return "bg-yellow-500/20";
        return "bg-red-500/20";
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            {/* Stepper */}
            <div className="flex items-center justify-between relative mb-16">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--border)] -z-10" />
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 -z-10"
                    style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                />

                {STEPS.map((step) => (
                    <div key={step.id} className="flex flex-col items-center gap-2 bg-[var(--background)] px-2">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step.id < currentStep
                                ? "bg-gradient-to-r from-indigo-500 to-purple-500 border-indigo-500 text-white"
                                : step.id === currentStep
                                    ? "bg-[var(--card)] border-indigo-500 text-indigo-600"
                                    : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)]"
                                }`}
                        >
                            {step.id < currentStep ? <CheckCircle2 size={20} /> : <step.icon size={18} />}
                        </div>
                        <span className={`text-xs font-semibold ${step.id <= currentStep ? "text-indigo-600" : "text-[var(--muted-foreground)]"}`}>
                            {step.title}
                        </span>
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="bg-[var(--card)] rounded-3xl p-8 border border-[var(--border)] shadow-lg min-h-[400px] flex flex-col items-center justify-center text-center transition-colors">

                {/* Step 1: Job Description */}
                {currentStep === 1 && (
                    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                            <Briefcase size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Enter the Job Description</h2>
                        <p className="text-[var(--muted-foreground)] mb-8">
                            Paste the job description to generate relevant interview questions and analyze your fit.
                        </p>

                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the full job description here...&#10;&#10;Example:&#10;We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies..."
                            className="w-full h-64 p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none mb-6 placeholder:text-[var(--muted-foreground)]"
                        />

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleJDSubmit}
                            className="w-full py-4 gradient-purple text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            Continue <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {/* Step 2: Upload Resume */}
                {currentStep === 2 && (
                    <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-6">
                            <Upload size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Upload Your Resume</h2>
                        <p className="text-[var(--muted-foreground)] mb-8">
                            We'll analyze your resume against the job description to identify your strengths and gaps.
                        </p>

                        <label className="block w-full h-48 border-2 border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50/10 transition-all group">
                            <div className="p-4 bg-[var(--card)] rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="text-sm font-semibold text-[var(--foreground)]">Click to upload</span>
                            <span className="text-xs text-[var(--muted-foreground)] mt-1">PDF only (Max 5MB)</span>
                            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                        </label>

                        {error && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Interview Type Selection */}
                {currentStep === 3 && (
                    <div className="w-full max-w-4xl animate-in fade-in slide-in-from-right-8">
                        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Interview Type</h2>
                        <p className="text-[var(--muted-foreground)] mb-8">Choose the format that matches your target role.</p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <button
                                onClick={() => handleTypeSelect("technical")}
                                className="group relative p-6 bg-[var(--card)] border-2 border-[var(--border)] rounded-2xl hover:border-indigo-500 hover:shadow-xl transition-all text-left"
                            >
                                <div className="absolute top-4 right-4 text-indigo-200 group-hover:text-indigo-500 transition-colors">
                                    <Code size={40} />
                                </div>
                                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                                    <Code size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Technical Interview</h3>
                                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                                    Focus on coding skills, system design, and technical problem solving.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-500/20 px-2 py-1 rounded">Coding</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-500/20 px-2 py-1 rounded">System Design</span>
                                </div>
                            </button>

                            <button
                                onClick={() => handleTypeSelect("abstract")}
                                className="group relative p-6 bg-[var(--card)] border-2 border-[var(--border)] rounded-2xl hover:border-pink-500 hover:shadow-xl transition-all text-left"
                            >
                                <div className="absolute top-4 right-4 text-pink-200 group-hover:text-pink-500 transition-colors">
                                    <BrainCircuit size={40} />
                                </div>
                                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition-transform">
                                    <Lightbulb size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Behavioral Interview</h3>
                                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                                    Focus on soft skills, behavioral questions, and collaborative scenarios.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-pink-600 bg-pink-500/20 px-2 py-1 rounded">Behavioral</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-pink-600 bg-pink-500/20 px-2 py-1 rounded">Soft Skills</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Analysis Loading */}
                {currentStep === 4 && isAnalyzing && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative w-24 h-24 mx-auto mb-8">
                            <div className="absolute inset-0 border-4 border-[var(--border)] rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-purple-500 rounded-full animate-spin"></div>
                            <Sparkles className="absolute inset-0 m-auto text-indigo-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Analyzing Your Fit...</h2>
                        <p className="text-[var(--muted-foreground)]">AI is comparing your resume against the job requirements.</p>
                        <div className="mt-8 flex justify-center gap-2">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}

                {/* Step 5: Review & Start */}
                {currentStep === 5 && analysisResult && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-8 text-left">
                        {/* Fit Score Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 ${getFitScoreBg(analysisResult.fit_analysis?.fit_score || 0)} rounded-2xl flex items-center justify-center`}>
                                    <span className={`text-2xl font-bold ${getFitScoreColor(analysisResult.fit_analysis?.fit_score || 0)}`}>
                                        {analysisResult.fit_analysis?.fit_score || 0}%
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--foreground)]">Job Fit Analysis</h2>
                                    <p className="text-sm text-[var(--muted-foreground)]">{analysisResult.profile?.current_role || "Candidate"}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-[var(--muted-foreground)]">{analysisResult.questions?.length || 0} Questions</p>
                                <p className="text-xs text-[var(--muted-foreground)]">{interviewType === 'technical' ? 'Technical' : 'Behavioral'} Interview</p>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 rounded-xl border border-indigo-500/20 mb-6">
                            <p className="text-sm text-[var(--foreground)]">{analysisResult.fit_analysis?.summary || "Analysis complete."}</p>
                        </div>

                        {/* Strengths & Weaknesses Grid - Clean Design */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* Strengths */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-green-500 flex items-center gap-2 text-base">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <TrendingUp size={18} />
                                    </div>
                                    Your Strengths
                                </h3>
                                <div className="space-y-3">
                                    {(analysisResult.fit_analysis?.strengths || []).map((strength, i) => {
                                        // Split by first colon to get title and description
                                        const colonIndex = strength.indexOf(':');
                                        let title = '';
                                        let description = strength;

                                        if (colonIndex > 0 && colonIndex < 50) {
                                            title = strength.substring(0, colonIndex).replace(/\*\*/g, '').trim();
                                            description = strength.substring(colonIndex + 1).trim();
                                        }

                                        return (
                                            <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-green-500/30 transition-all">
                                                {title && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle2 size={16} className="text-green-500" />
                                                        <span className="font-semibold text-green-400 text-sm">{title}</span>
                                                    </div>
                                                )}
                                                <p className="text-[var(--muted-foreground)] text-sm leading-relaxed pl-6">
                                                    {description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Weaknesses / Gaps */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-amber-500 flex items-center gap-2 text-base">
                                    <div className="p-2 bg-amber-500/20 rounded-lg">
                                        <TrendingDown size={18} />
                                    </div>
                                    Areas to Develop
                                </h3>
                                <div className="space-y-3">
                                    {(analysisResult.fit_analysis?.weaknesses || []).map((weakness, i) => {
                                        // Split by first colon to get title and description
                                        const colonIndex = weakness.indexOf(':');
                                        let title = '';
                                        let description = weakness;

                                        if (colonIndex > 0 && colonIndex < 50) {
                                            title = weakness.substring(0, colonIndex).replace(/\*\*/g, '').trim();
                                            description = weakness.substring(colonIndex + 1).trim();
                                        }

                                        return (
                                            <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-amber-500/30 transition-all">
                                                {title && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <AlertCircle size={16} className="text-amber-500" />
                                                        <span className="font-semibold text-amber-400 text-sm">{title}</span>
                                                    </div>
                                                )}
                                                <p className="text-[var(--muted-foreground)] text-sm leading-relaxed pl-6">
                                                    {description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={startSimulation}
                            className="w-full py-4 gradient-purple text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                        >
                            Start Interview Simulation <ArrowRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
