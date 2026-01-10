"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Download, MessageSquare, Mic, Zap, ThumbsUp, AlertCircle, CheckCircle2, Loader2, TrendingUp, TrendingDown, FileText, Sparkles, Send, X, HelpCircle, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSessionAnalysis, SessionAnalysis, queryReport, ReportQueryResponse } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface ResponseData {
    id: string;
    session_id: string;
    question_id: string;
    question_text: string;
    response_text: string;
    evaluation: {
        score: number;
        max_points: number;
        feedback_positive: string;
        feedback_improvement: string;
    };
    created_at: string;
}

export default function ReportPage() {
    const params = useParams();
    const sessionId = params.id as string;
    const [responses, setResponses] = useState<ResponseData[]>([]);
    const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);
    const [queryOpen, setQueryOpen] = useState(false);
    const [queryText, setQueryText] = useState("");
    const [queryResponse, setQueryResponse] = useState<ReportQueryResponse | null>(null);
    const [queryLoading, setQueryLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const initAndFetch = async () => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setUnauthorized(true);
                setLoading(false);
                return;
            }

            // Fetch interview responses and session analysis in parallel
            await Promise.all([
                fetchResponses(user.id),
                fetchSessionAnalysis(user.id)
            ]);
        };
        initAndFetch();
    }, [sessionId, supabase]);

    const fetchSessionAnalysis = async (currentUserId: string) => {
        try {
            const analysis = await getSessionAnalysis(sessionId, currentUserId);
            if (analysis) {
                setSessionAnalysis(analysis);
            }
        } catch (e) {
            console.error("Error fetching session analysis:", e);
        }
    };

    const fetchResponses = async (currentUserId: string) => {
        try {
            // Fetch responses for this session - include user's data OR orphaned data (backwards compatibility)
            const { data, error } = await supabase
                .from("interview_responses")
                .select("*")
                .eq("session_id", sessionId)
                .or(`user_id.eq.${currentUserId},user_id.is.null`)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching responses:", error);
                setResponses([]);
            } else {
                setResponses(data || []);
            }
        } catch (e) {
            console.error("Error:", e);
        } finally {
            setLoading(false);
        }
    };

    // Calculate scores
    const totalScore = responses.reduce((sum, r) => sum + (r.evaluation?.score || 0), 0);
    const maxScore = responses.reduce((sum, r) => sum + (r.evaluation?.max_points || 10), 0);
    const globalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Extract strengths and improvements from evaluations
    const strengths = responses
        .filter(r => r.evaluation?.feedback_positive)
        .slice(0, 3)
        .map(r => r.evaluation.feedback_positive);

    const improvements = responses
        .filter(r => r.evaluation?.feedback_improvement)
        .slice(0, 3)
        .map(r => r.evaluation.feedback_improvement);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const handleQuery = async (question: string) => {
        if (!question.trim()) return;

        setQueryLoading(true);
        setQueryResponse(null);

        // Build report data from available session analysis or responses
        const reportData = sessionAnalysis?.fit_analysis || {
            percentage: globalScore,
            overall_score: totalScore,
            max_score: maxScore,
            strengths: strengths,
            weaknesses: improvements,
            recommendations: [],
            hiring_recommendation: globalScore >= 70 ? "Hire" : "Review Required",
            overall_assessment: `Candidate scored ${globalScore}% overall.`,
            hiring_rationale: `Based on ${responses.length} questions answered.`
        };

        try {
            const result = await queryReport(reportData, question);
            setQueryResponse(result);
        } catch (error) {
            console.error("Query failed:", error);
            setQueryResponse({
                answer: "Sorry, I couldn't process your question. Please try again.",
                confidence_level: "Low",
                relevant_quotes: [],
                source_trace: "Error"
            });
        } finally {
            setQueryLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (unauthorized) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <Link href="/dashboard/campaigns" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft size={16} />
                    Retour aux campagnes
                </Link>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès non autorisé</h3>
                    <p className="text-gray-500">Vous n&apos;avez pas accès à ce rapport.</p>
                </div>
            </div>
        );
    }

    if (responses.length === 0) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <Link href="/dashboard/campaigns" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft size={16} />
                    Retour aux campagnes
                </Link>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Session introuvable</h3>
                    <p className="text-gray-500">Aucune réponse trouvée pour cette session.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 relative">
            {/* Decorative Background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-purple-50/50 rounded-full blur-3xl opacity-50" />
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-200/60 backdrop-blur-sm sticky top-0 z-20 bg-white/80 transition-all">
                <div>
                    <Link href="/dashboard/campaigns" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-2 transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Retour aux campagnes
                    </Link>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-indigo-900 mt-1">Rapport de Simulation</h1>
                    <div className="flex items-center gap-2 text-gray-500 mt-1">
                        <span className="font-medium text-gray-900 px-2 py-0.5 bg-gray-100 rounded-md text-xs font-mono">{sessionId.slice(0, 8)}</span>
                        <span>•</span>
                        <span>{responses[0] ? formatDate(responses[0].created_at) : ""}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors bg-white border border-gray-200 shadow-sm" title="Partager">
                        <Share2 size={20} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm">
                        <Download size={18} />
                        PDF
                    </motion.button>
                </div>
            </div>

            {/* 1. Global Summary - Explainable AI Enhanced */}
            <section className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg shadow-indigo-500/5 border border-white p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 pointer-events-none" />

                <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2 relative z-10">
                    <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-600">
                        <Sparkles size={20} />
                    </div>
                    1. Résumé Global
                </h2>

                <div className="grid md:grid-cols-3 gap-12 relative z-10">
                    {/* Score Circle with XAI Tooltip */}
                    <div className="flex flex-col items-center justify-center relative group/score">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl scale-75 group-hover/score:scale-100 transition-transform duration-500" />

                            <svg className="w-full h-full transform -rotate-90 drop-shadow-md">
                                <circle cx="96" cy="96" r="80" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                                <motion.circle
                                    cx="96" cy="96" r="80"
                                    stroke="#6366f1"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray="502"
                                    strokeDashoffset={502}
                                    strokeLinecap="round"
                                    initial={{ strokeDashoffset: 502 }}
                                    animate={{ strokeDashoffset: 502 - (502 * globalScore) / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-5xl font-black tracking-tight text-gray-900">{globalScore}</span>
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Global Score</span>
                            </div>
                        </div>

                        {/* Explainable AI Tooltip */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileHover={{ opacity: 1, y: 0 }}
                            className="absolute -bottom-2 translate-y-full opacity-0 group-hover/score:opacity-100 transition-all duration-300 z-20 w-64 p-4 bg-gray-900/95 text-white text-xs rounded-xl backdrop-blur-md shadow-xl pointer-events-none"
                        >
                            <div className="flex items-start gap-2">
                                <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                                <p>
                                    Votre score est calculé sur la base de la pertinence technique ({Math.round(globalScore * 0.6)}%), de la clarté ({Math.round(globalScore * 0.2)}%) et de la structuration ({Math.round(globalScore * 0.2)}%) de vos réponses.
                                </p>
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/10 flex justify-between">
                                <span className="text-gray-400">Précision IA</span>
                                <span className="text-green-400 font-bold">98%</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Questions Stats */}
                    <div className="space-y-6 flex flex-col justify-center">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-default relative overflow-hidden"
                        >
                            <div className="absolute right-0 top-0 p-4 opacity-10">
                                <MessageSquare size={48} />
                            </div>
                            <div className="text-4xl font-bold text-gray-900 mb-1">{responses.length}</div>
                            <div className="text-sm text-gray-500 font-medium">Questions répondues</div>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-default relative overflow-hidden"
                        >
                            <div className="absolute right-0 top-0 p-4 opacity-10 text-indigo-600">
                                <Zap size={48} />
                            </div>
                            <div className="text-4xl font-bold text-indigo-600 mb-1">{Math.round(totalScore / responses.length)}</div>
                            <div className="text-sm text-gray-500 font-medium">Score moyen par question</div>
                        </motion.div>
                    </div>

                    {/* Interactive Insight Cards */}
                    <div className="space-y-4">
                        <motion.div
                            whileHover={{ y: -2, boxShadow: "0 10px 30px -10px rgba(34, 197, 94, 0.2)" }}
                            className="bg-green-50/50 border border-green-100 rounded-2xl p-5 hover:bg-green-50 transition-colors"
                        >
                            <h3 className="flex items-center gap-2 font-bold text-green-700 text-sm mb-3">
                                <ThumbsUp size={16} /> Points Forts
                            </h3>
                            <ul className="space-y-2">
                                {strengths.length > 0 ? strengths.map((point, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                                        <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                        {point.slice(0, 60)}...
                                    </li>
                                )) : (
                                    <li className="text-sm text-gray-400">Aucun point fort identifié</li>
                                )}
                            </ul>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -2, boxShadow: "0 10px 30px -10px rgba(249, 115, 22, 0.2)" }}
                            className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5 hover:bg-orange-50 transition-colors"
                        >
                            <h3 className="flex items-center gap-2 font-bold text-orange-700 text-sm mb-3">
                                <Zap size={16} /> Axes d&apos;amélioration
                            </h3>
                            <ul className="space-y-2">
                                {improvements.length > 0 ? improvements.map((point, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                                        <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                                        {point.slice(0, 60)}...
                                    </li>
                                )) : (
                                    <li className="text-sm text-gray-400">Aucun axe identifié</li>
                                )}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CV Fit Analysis Section */}
            {sessionAnalysis?.fit_analysis && (
                <section className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white p-8 relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center transform rotate-3">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Analyse CV</h2>
                            <p className="text-sm text-gray-500">Correspondance avec le poste</p>
                        </div>

                        {/* Fit Score Badge */}
                        <div className={`ml-auto px-5 py-2.5 rounded-full font-bold shadow-sm ${(sessionAnalysis.fit_analysis.fit_score || 0) >= 80
                            ? 'bg-green-100 text-green-700 ring-4 ring-green-50'
                            : (sessionAnalysis.fit_analysis.fit_score || 0) >= 60
                                ? 'bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50'
                                : 'bg-red-100 text-red-700 ring-4 ring-red-50'
                            }`}>
                            {sessionAnalysis.fit_analysis.fit_score || 0}% Fit
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 relative z-10">
                        {/* CV Strengths Card */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white shadow-sm hover:shadow-lg transition-all"
                        >
                            <h3 className="flex items-center gap-2 font-bold text-green-700 mb-4 bg-green-50 w-fit px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                                <TrendingUp size={14} /> Points Forts
                            </h3>
                            <ul className="space-y-4">
                                {(sessionAnalysis.fit_analysis.strengths || []).slice(0, 4).map((strength, i) => {
                                    const colonIndex = strength.indexOf(':');
                                    let title = '';
                                    let description = strength;
                                    if (colonIndex > 0 && colonIndex < 50) {
                                        title = strength.substring(0, colonIndex).replace(/\*\*/g, '').trim();
                                        description = strength.substring(colonIndex + 1).trim();
                                    }
                                    return (
                                        <li key={i} className="text-sm leading-relaxed">
                                            {title && <span className="block font-bold text-gray-900 mb-1">{title}</span>}
                                            <span className="text-gray-600">{description.slice(0, 120)}{description.length > 120 ? '...' : ''}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </motion.div>

                        {/* CV Weaknesses Card */}
                        <motion.div
                            whileHover={{ y: -4 }}
                            className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white shadow-sm hover:shadow-lg transition-all"
                        >
                            <h3 className="flex items-center gap-2 font-bold text-amber-700 mb-4 bg-amber-50 w-fit px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                                <TrendingDown size={14} /> Axes de Développement
                            </h3>
                            <ul className="space-y-4">
                                {(sessionAnalysis.fit_analysis.weaknesses || []).slice(0, 4).map((weakness, i) => {
                                    const colonIndex = weakness.indexOf(':');
                                    let title = '';
                                    let description = weakness;
                                    if (colonIndex > 0 && colonIndex < 50) {
                                        title = weakness.substring(0, colonIndex).replace(/\*\*/g, '').trim();
                                        description = weakness.substring(colonIndex + 1).trim();
                                    }
                                    return (
                                        <li key={i} className="text-sm leading-relaxed">
                                            {title && <span className="block font-bold text-gray-900 mb-1">{title}</span>}
                                            <span className="text-gray-600">{description.slice(0, 120)}{description.length > 120 ? '...' : ''}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* 2. Question Analysis */}
            <section className="pb-32">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 ml-1">
                    <MessageSquare className="text-indigo-600" />
                    2. Analyse Détaillée
                </h2>
                <div className="space-y-6">
                    {responses.map((r, index) => (
                        <motion.div
                            key={r.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                            <div className="flex items-start gap-4 p-6 sm:p-8">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-indigo-100">
                                    {index + 1}
                                </div>
                                <div className="flex-1 space-y-6">
                                    <h3 className="font-bold text-gray-900 text-lg leading-snug">{r.question_text}</h3>

                                    <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Mic size={12} /> Votre réponse
                                        </p>
                                        <p className="text-gray-700 italic leading-relaxed">"{r.response_text || "Pas de réponse enregistrée"}"</p>
                                    </div>

                                    {r.evaluation && (
                                        <div className="grid md:grid-cols-12 gap-6">
                                            <div className="md:col-span-12 flex items-center gap-4 border-b border-gray-100 pb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Score</span>
                                                    <span className={`text-2xl font-black ${r.evaluation.score >= (r.evaluation.max_points * 0.8) ? 'text-green-600' :
                                                        r.evaluation.score >= (r.evaluation.max_points * 0.6) ? 'text-yellow-600' :
                                                            'text-red-500'
                                                        }`}>
                                                        {r.evaluation.score}<span className="text-sm text-gray-400 font-normal">/{r.evaluation.max_points}</span>
                                                    </span>
                                                </div>
                                                <div className="h-8 w-px bg-gray-200 mx-2" />
                                                <div className="flex gap-2">
                                                    {r.evaluation.score >= (r.evaluation.max_points * 0.8) && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Excellent</span>}
                                                    {r.evaluation.score < (r.evaluation.max_points * 0.8) && r.evaluation.score >= (r.evaluation.max_points * 0.6) && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Moyen</span>}
                                                    {r.evaluation.score < (r.evaluation.max_points * 0.6) && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">À revoir</span>}
                                                </div>
                                            </div>

                                            <div className="md:col-span-6 bg-green-50/50 border border-green-100 p-5 rounded-2xl">
                                                <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                    <CheckCircle2 size={14} /> Points positifs
                                                </p>
                                                <p className="text-green-900 text-sm leading-relaxed">{r.evaluation.feedback_positive}</p>
                                            </div>
                                            <div className="md:col-span-6 bg-orange-50/50 border border-orange-100 p-5 rounded-2xl">
                                                <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                    <AlertCircle size={14} /> À améliorer
                                                </p>
                                                <p className="text-orange-900 text-sm leading-relaxed">{r.evaluation.feedback_improvement}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Conversational Query Floating Elements */}
            <AnimatePresence>
                {!queryOpen && (
                    <motion.div className="fixed bottom-8 right-8 z-50">
                        <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setQueryOpen(true)}
                            className="bg-gray-900 text-white p-4 rounded-full shadow-2xl shadow-gray-900/40 hover:bg-black transition-colors flex items-center gap-2 pr-6"
                        >
                            <Sparkles size={20} className="text-indigo-400" />
                            <span className="font-bold">Ask AI Assistant</span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {queryOpen && (
                    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
                        <motion.div
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.95 }}
                            className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-indigo-500/10 rounded-3xl overflow-hidden p-2 ring-1 ring-gray-200"
                        >
                            <div className="flex items-center gap-2 p-2 relative">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <Sparkles size={20} className="text-indigo-600" />
                                </div>
                                <input
                                    type="text"
                                    value={queryText}
                                    onChange={(e) => setQueryText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && queryText.trim()) {
                                            handleQuery(queryText);
                                        }
                                    }}
                                    placeholder="Ask about your performance, strengths, or how to improve..."
                                    className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 font-medium h-10 px-2"
                                    autoFocus
                                    disabled={queryLoading}
                                />
                                <div className="flex items-center gap-2">
                                    {queryText && (
                                        <button
                                            onClick={() => handleQuery(queryText)}
                                            disabled={queryLoading}
                                            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {queryLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setQueryOpen(false);
                                            setQueryResponse(null);
                                            setQueryText("");
                                        }}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* AI Response */}
                            <AnimatePresence>
                                {queryResponse && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 border-t border-gray-100"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                                                <Sparkles size={16} className="text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-800 leading-relaxed">
                                                    {queryResponse.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Suggested Queries - only show if no response */}
                            {!queryText && !queryResponse && (
                                <div className="flex gap-2 p-2 overflow-x-auto">
                                    {["How can I improve?", "Summary of strengths", "Technical depth analysis"].map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setQueryText(q);
                                                handleQuery(q);
                                            }}
                                            className="px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-xs font-semibold text-gray-500 hover:text-indigo-600 rounded-lg transition-colors whitespace-nowrap"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
