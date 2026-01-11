"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    FileText, CheckCircle2, ArrowRight, Target, BrainCircuit,
    Code, Lightbulb, Upload, Briefcase, TrendingUp, TrendingDown,
    Sparkles, AlertCircle
} from "lucide-react";
import { analyzeResume, ResumeAnalysisResponse, saveSessionAnalysis } from "@/lib/api";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { NeuralTextArea } from "@/components/ui/NeuralTextArea";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
    { id: 1, title: "Job Description", icon: Briefcase },
    { id: 2, title: "Upload Resume", icon: Upload },
    { id: 3, title: "Interview Type", icon: Lightbulb },
    { id: 4, title: "AI Analysis", icon: BrainCircuit },
    { id: 5, title: "Review & Start", icon: Target },
];

const springTransition = {
    type: "spring",
    stiffness: 400,
    damping: 30
} as const;

export default function NewSimulationPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [jobDescription, setJobDescription] = useState("");
    const [interviewType, setInterviewType] = useState<"technical" | "abstract">("technical");
    const [questionCount, setQuestionCount] = useState(5);
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
            const result = await analyzeResume(file, jobDescription, type, questionCount);
            setAnalysisResult(result);
            setIsAnalyzing(false);
            setCurrentStep(5);
        } catch (err: any) {
            setError(err.message || "Error during analysis.");
            setIsAnalyzing(false);
            setCurrentStep(1);
        }
    };

    const startSimulation = async () => {
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

        // Save to localStorage for simulation page (quick access)
        localStorage.setItem("interview_session", JSON.stringify(session));

        // Save to Supabase database for persistence
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            await saveSessionAnalysis(
                sessionId,
                analysisResult.fit_analysis,
                sessionName,
                user?.id,
                analysisResult.questions,
                analysisResult.profile,
                jobDescription,
                interviewType
            );
            console.log("Session saved to database:", sessionId);
        } catch (err) {
            console.error("Failed to save session to database:", err);
            // Continue anyway - localStorage backup exists
        }

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
            {/* Sentient Stepper - Liquid Flow Style */}
            <div className="relative mb-16 px-4">
                <div className="flex items-center justify-between relative">
                    {/* Background Line */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full overflow-hidden -z-10">
                        {/* Liquid Flow Fill */}
                        <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 origin-left"
                            initial={{ scaleX: 0 }}
                            animate={{
                                scaleX: (currentStep - 1) / (STEPS.length - 1)
                            }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </div>

                    <LayoutGroup>
                        {STEPS.map((step) => {
                            const isCompleted = step.id < currentStep;
                            const isCurrent = step.id === currentStep;
                            const isClickable = isCompleted;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => isClickable && setCurrentStep(step.id)}
                                    disabled={!isClickable}
                                    className={`relative flex flex-col items-center gap-3 transition-colors duration-300 group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div className="relative">
                                        <motion.div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 transition-colors duration-300 ${isCompleted
                                                ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40"
                                                : isCurrent
                                                    ? "bg-white border-2 border-indigo-500 text-indigo-600"
                                                    : "bg-white border-2 border-gray-100 text-gray-300"
                                                }`}
                                            whileHover={isClickable ? { scale: 1.1 } : {}}
                                            whileTap={isClickable ? { scale: 0.95 } : {}}
                                            layout
                                        >
                                            <AnimatePresence mode="wait">
                                                {isCompleted ? (
                                                    <motion.div
                                                        key="check"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                    >
                                                        <CheckCircle2 size={20} strokeWidth={3} />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="icon"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                    >
                                                        <step.icon size={20} strokeWidth={isCurrent ? 2.5 : 2} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Neural Pulse for Active Step */}
                                            {isCurrent && (
                                                <motion.div
                                                    className="absolute inset-0 rounded-full border-2 border-indigo-500 opacity-50"
                                                    initial={{ scale: 1, opacity: 0.5 }}
                                                    animate={{ scale: 1.5, opacity: 0 }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                />
                                            )}
                                        </motion.div>
                                    </div>

                                    <span className={`text-xs font-bold transition-colors duration-300 absolute -bottom-8 w-max ${isCompleted ? "text-purple-600" : isCurrent ? "text-indigo-600" : "text-gray-300"
                                        }`}>
                                        {step.title}
                                    </span>
                                </button>
                            );
                        })}
                    </LayoutGroup>
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl shadow-indigo-500/5 min-h-[500px] flex flex-col items-center justify-center text-center transition-all relative overflow-hidden">
                {/* Decorative background blobs */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Step 1: Job Description */}
                {currentStep === 1 && (
                    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6 shadow-sm">
                            <Briefcase size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter the Job Description</h2>
                        <p className="text-gray-500 mb-10 text-lg">
                            Paste the job description to generate relevant interview questions and analyze your fit.
                        </p>

                        <div className="mb-8 text-left">
                            <NeuralTextArea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the full job description here...&#10;&#10;Example:&#10;We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies..."
                                className="h-64 font-normal leading-relaxed text-gray-700 placeholder-gray-400"
                                characterCount={jobDescription.length}
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm justify-center border border-red-100"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        <div className="flex justify-center">
                            <MagneticButton
                                onClick={handleJDSubmit}
                                className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow"
                            >
                                Continue <ArrowRight size={20} />
                            </MagneticButton>
                        </div>
                    </div>
                )}

                {/* Step 2: Upload Resume */}
                {currentStep === 2 && (
                    <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-6 shadow-sm">
                            <Upload size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Resume</h2>
                        <p className="text-gray-500 mb-10 text-lg">
                            We'll analyze your resume against the job description to identify your strengths and gaps.
                        </p>

                        <label className="block w-full h-56 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50/30 transition-all group bg-white/50 relative overflow-hidden">
                            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-4 bg-white rounded-full shadow-md mb-4 group-hover:scale-110 transition-transform relative z-10">
                                <Upload className="w-8 h-8 text-green-600" />
                            </div>
                            <span className="text-lg font-semibold text-gray-700 relative z-10">Click to upload</span>
                            <span className="text-sm text-gray-400 mt-2 relative z-10">PDF only (Max 5MB)</span>
                            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                        </label>

                        {error && (
                            <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 text-sm border border-red-100">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Interview Type Selection */}
                {currentStep === 3 && (
                    <div className="w-full max-w-4xl animate-in fade-in slide-in-from-right-8 relative z-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Interview Type</h2>
                        <p className="text-gray-500 mb-10 text-lg">Choose the format that matches your target role.</p>

                        <div className="grid md:grid-cols-2 gap-6 mb-10">
                            <button
                                onClick={() => handleTypeSelect("technical")}
                                className="group relative p-8 bg-white border border-gray-100 rounded-3xl hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-left overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-4 right-4 text-indigo-100 group-hover:text-indigo-500/20 transition-colors transform group-hover:rotate-12 duration-500">
                                    <Code size={80} />
                                </div>
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                    <Code size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">Technical Interview</h3>
                                <p className="text-sm text-gray-500 mb-6 relative z-10 leading-relaxed">
                                    Focus on coding skills, system design, and technical problem solving.
                                </p>
                                <div className="flex flex-wrap gap-2 relative z-10">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">Coding</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">System Design</span>
                                </div>
                            </button>

                            <button
                                onClick={() => handleTypeSelect("abstract")}
                                className="group relative p-8 bg-white border border-gray-100 rounded-3xl hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/10 transition-all text-left overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-4 right-4 text-pink-100 group-hover:text-pink-500/20 transition-colors transform group-hover:-rotate-12 duration-500">
                                    <BrainCircuit size={80} />
                                </div>
                                <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                    <Lightbulb size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">Behavioral Interview</h3>
                                <p className="text-sm text-gray-500 mb-6 relative z-10 leading-relaxed">
                                    Focus on soft skills, behavioral questions, and collaborative scenarios.
                                </p>
                                <div className="flex flex-wrap gap-2 relative z-10">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-pink-600 bg-pink-50 px-2.5 py-1.5 rounded-lg border border-pink-100">Behavioral</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-pink-600 bg-pink-50 px-2.5 py-1.5 rounded-lg border border-pink-100">Soft Skills</span>
                                </div>
                            </button>
                        </div>

                        {/* Question Count Slider */}
                        <div className="p-8 bg-white/50 border border-white rounded-3xl backdrop-blur-sm shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <label className="text-lg font-bold text-gray-900">Number of Questions</label>
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-xl font-bold text-indigo-600 border border-indigo-100">
                                    {questionCount}
                                </div>
                            </div>
                            <input
                                type="range"
                                min="3"
                                max="10"
                                value={questionCount}
                                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between mt-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                <span>Short (3)</span>
                                <span>Standard (5)</span>
                                <span>Long (10)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Analysis Loading */}
                {currentStep === 4 && isAnalyzing && (
                    <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-8">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-purple-500 rounded-full animate-spin"></div>
                            <Sparkles className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Analyzing Your Fit...</h2>
                        <p className="text-gray-500 text-lg mb-8">AI is comparing your resume against the job requirements.</p>

                        <div className="flex gap-3">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-3 h-3 bg-indigo-500 rounded-full"
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 5: Review & Start */}
                {currentStep === 5 && analysisResult && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-8 text-left relative z-10">
                        {/* Fit Score Header */}
                        <div className="flex items-center justify-between mb-8 p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-6">
                                <div className={`w-20 h-20 ${getFitScoreBg(analysisResult.fit_analysis?.fit_score || 0)} rounded-2xl flex items-center justify-center relative overflow-hidden group`}>
                                    <div className="absolute inset-0 opacity-20 bg-current animate-pulse" />
                                    <span className={`text-3xl font-bold ${getFitScoreColor(analysisResult.fit_analysis?.fit_score || 0)} relative z-10`}>
                                        {analysisResult.fit_analysis?.fit_score || 0}%
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Job Fit Analysis</h2>
                                    <p className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full inline-block">
                                        {analysisResult.profile?.current_role || "Candidate"}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-900">{analysisResult.questions?.length || 0} Questions</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{interviewType} Interview</p>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <p className="text-gray-700 leading-relaxed relative z-10 font-medium">
                                {analysisResult.fit_analysis?.summary || "Analysis complete."}
                            </p>
                        </div>

                        {/* Strengths & Weaknesses Grid - Clean Design */}
                        <div className="grid md:grid-cols-2 gap-6 mb-10">
                            {/* Strengths */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-green-600 flex items-center gap-3 text-lg">
                                    <div className="p-2 bg-green-100 rounded-xl">
                                        <TrendingUp size={20} />
                                    </div>
                                    Your Strengths
                                </h3>
                                <div className="space-y-3">
                                    {(analysisResult.fit_analysis?.strengths || []).map((strength, i) => {
                                        const colonIndex = strength.indexOf(':');
                                        let title = '';
                                        let description = strength;

                                        if (colonIndex > 0 && colonIndex < 50) {
                                            title = strength.substring(0, colonIndex).replace(/\*\*/g, '').trim();
                                            description = strength.substring(colonIndex + 1).trim();
                                        }

                                        return (
                                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-green-200 hover:shadow-lg hover:shadow-green-500/5 transition-all">
                                                {title && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                                                        <span className="font-bold text-green-700 text-sm">{title}</span>
                                                    </div>
                                                )}
                                                <p className="text-gray-500 text-sm leading-relaxed pl-7">
                                                    {description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Weaknesses / Gaps */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-amber-600 flex items-center gap-3 text-lg">
                                    <div className="p-2 bg-amber-100 rounded-xl">
                                        <TrendingDown size={20} />
                                    </div>
                                    Areas to Develop
                                </h3>
                                <div className="space-y-3">
                                    {(analysisResult.fit_analysis?.weaknesses || []).map((weakness, i) => {
                                        const colonIndex = weakness.indexOf(':');
                                        let title = '';
                                        let description = weakness;

                                        if (colonIndex > 0 && colonIndex < 50) {
                                            title = weakness.substring(0, colonIndex).replace(/\*\*/g, '').trim();
                                            description = weakness.substring(colonIndex + 1).trim();
                                        }

                                        return (
                                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
                                                {title && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                                                        <span className="font-bold text-amber-700 text-sm">{title}</span>
                                                    </div>
                                                )}
                                                <p className="text-gray-500 text-sm leading-relaxed pl-7">
                                                    {description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <MagneticButton
                                onClick={startSimulation}
                                className="px-10 py-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-full font-bold shadow-2xl shadow-gray-500/30 hover:shadow-gray-500/50 hover:scale-105 transition-all"
                            >
                                Start Interview Simulation <ArrowRight size={20} />
                            </MagneticButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
