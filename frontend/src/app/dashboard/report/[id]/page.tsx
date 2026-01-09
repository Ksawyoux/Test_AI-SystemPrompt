"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Download, MessageSquare, Mic, Zap, ThumbsUp, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchResponses();
    }, [sessionId]);

    const fetchResponses = async () => {
        try {
            const { data, error } = await supabase
                .from("interview_responses")
                .select("*")
                .eq("session_id", sessionId)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching responses:", error);
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

    if (loading) {
        return (
            <div className="p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
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
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-200">
                <div>
                    <Link href="/dashboard/campaigns" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-2 transition-colors">
                        <ArrowLeft size={16} />
                        Retour aux campagnes
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mt-1">Rapport de Simulation</h1>
                    <div className="flex items-center gap-2 text-gray-500 mt-1">
                        <span className="font-medium text-gray-900">Session: {sessionId.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>{responses[0] ? formatDate(responses[0].created_at) : ""}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Partager">
                        <Share2 size={20} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                        <Download size={18} />
                        PDF
                    </button>
                </div>
            </div>

            {/* 1. Global Summary */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">1. Résumé Global</h2>
                <div className="grid md:grid-cols-3 gap-12">
                    {/* Score Circle */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                                <circle cx="80" cy="80" r="70" stroke="#6366f1" strokeWidth="12" fill="transparent" strokeDasharray="440" strokeDashoffset={440 - (440 * globalScore) / 100} strokeLinecap="round" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-bold text-indigo-600">{globalScore}</span>
                                <span className="text-sm font-medium text-gray-400">/ 100</span>
                            </div>
                        </div>
                        <p className="mt-4 font-semibold text-gray-900">Score Global IA</p>
                        <p className="text-sm text-gray-500">{totalScore} pts sur {maxScore}</p>
                    </div>

                    {/* Questions Stats */}
                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-gray-900">{responses.length}</div>
                            <div className="text-sm text-gray-500">Questions répondues</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-indigo-600">{Math.round(totalScore / responses.length)}</div>
                            <div className="text-sm text-gray-500">Score moyen par question</div>
                        </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="flex items-center gap-2 font-bold text-green-700 text-sm mb-3">
                                <ThumbsUp size={16} /> Points Forts
                            </h3>
                            <ul className="space-y-2">
                                {strengths.length > 0 ? strengths.map((point, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-gray-600">
                                        <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                        {point.slice(0, 100)}...
                                    </li>
                                )) : (
                                    <li className="text-sm text-gray-400">Aucun point fort identifié</li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h3 className="flex items-center gap-2 font-bold text-orange-700 text-sm mb-3">
                                <Zap size={16} /> Axes d&apos;amélioration
                            </h3>
                            <ul className="space-y-2">
                                {improvements.length > 0 ? improvements.map((point, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-gray-600">
                                        <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                                        {point.slice(0, 100)}...
                                    </li>
                                )) : (
                                    <li className="text-sm text-gray-400">Aucun axe identifié</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Question Analysis */}
            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MessageSquare className="text-indigo-600" />
                    2. Analyse Question par Question
                </h2>
                <div className="space-y-4">
                    {responses.map((r, index) => (
                        <div key={r.id || index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex items-start gap-4 p-6">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                                    {index + 1}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <h3 className="font-semibold text-gray-900 text-lg">{r.question_text}</h3>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Votre réponse</p>
                                        <p className="text-gray-700">{r.response_text || "Pas de réponse enregistrée"}</p>
                                    </div>

                                    {r.evaluation && (
                                        <>
                                            <div className="flex items-center gap-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${r.evaluation.score >= (r.evaluation.max_points * 0.8) ? 'bg-green-100 text-green-700' :
                                                    r.evaluation.score >= (r.evaluation.max_points * 0.6) ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {r.evaluation.score}/{r.evaluation.max_points} pts
                                                </span>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
                                                    <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Points positifs</p>
                                                    <p className="text-green-800 text-sm">{r.evaluation.feedback_positive}</p>
                                                </div>
                                                <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg">
                                                    <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">À améliorer</p>
                                                    <p className="text-orange-800 text-sm">{r.evaluation.feedback_improvement}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Session Info */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Mic className="text-indigo-600" />
                        3. Informations Session
                    </h2>
                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                        Analysé par IA • Aucun audio conservé
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Session ID</div>
                        <div className="font-semibold text-gray-900 text-sm font-mono">{sessionId.slice(0, 12)}...</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Questions</div>
                        <div className="font-semibold text-gray-900">{responses.length}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Score Total</div>
                        <div className="font-semibold text-gray-900">{totalScore}/{maxScore}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Pourcentage</div>
                        <div className="font-semibold text-indigo-600">{globalScore}%</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
