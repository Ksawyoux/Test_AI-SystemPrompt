"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, FileText, Calendar, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

interface InterviewSession {
    session_id: string;
    role: string;
    created_at: string;
    total_score: number;
    max_score: number;
    question_count: number;
    status: "completed" | "pending";
}

export default function CampaignsPage() {
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        // First get the current user, then fetch their sessions
        const initAndFetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                await fetchSessions(user.id);
            } else {
                setLoading(false);
            }
        };
        initAndFetch();
    }, [supabase]);

    const fetchSessions = async (currentUserId: string) => {
        try {
            // Fetch responses for the current user OR sessions without user_id (backwards compatibility)
            const { data, error } = await supabase
                .from("interview_responses")
                .select("*")
                .or(`user_id.eq.${currentUserId},user_id.is.null`)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching sessions:", error);
                setLoading(false);
                return;
            }

            if (!data || data.length === 0) {
                setSessions([]);
                setLoading(false);
                return;
            }

            // Group by session_id
            const sessionMap = new Map<string, any[]>();
            data.forEach((row: any) => {
                const sid = row.session_id;
                if (!sessionMap.has(sid)) {
                    sessionMap.set(sid, []);
                }
                sessionMap.get(sid)!.push(row);
            });

            // Build session summaries
            const sessionList: InterviewSession[] = [];
            sessionMap.forEach((responses, sessionId) => {
                let totalScore = 0;
                let maxScore = 0;
                let role = responses[0]?.session_name || "Interview Session";

                responses.forEach((r: any) => {
                    if (r.evaluation) {
                        totalScore += r.evaluation.score || 0;
                        maxScore += r.evaluation.max_points || 10;
                    }
                });

                sessionList.push({
                    session_id: sessionId,
                    role: role,
                    created_at: responses[0]?.created_at || new Date().toISOString(),
                    total_score: totalScore,
                    max_score: maxScore,
                    question_count: responses.length,
                    status: "completed"
                });
            });

            setSessions(sessionList);
        } catch (e) {
            console.error("Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const getScorePercentage = (total: number, max: number) => {
        if (max === 0) return 0;
        return Math.round((total / max) * 100);
    };

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto relative z-10">
            {/* Background Gradients */}
            <div className="fixed top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="fixed bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Mes Campagnes</h1>
                    <p className="text-gray-500 mt-1">Gérez et analysez vos sessions d&apos;interviews</p>
                </div>
                <Link
                    href="/dashboard/new-simulation"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all font-bold shadow-lg shadow-gray-900/20 hover:shadow-gray-900/40 transform hover:-translate-y-0.5"
                >
                    <Play size={18} fill="currentColor" />
                    Nouvelle Simulation
                </Link>
            </div>

            {sessions.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-sm border border-white/60 p-16 text-center">
                    <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm transform hover:rotate-6 transition-transform duration-300">
                        <FileText className="w-10 h-10 text-indigo-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune session</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Vous n&apos;avez pas encore effectué d&apos;entretien. Commencez une nouvelle simulation pour voir vos résultats ici.</p>
                    <Link
                        href="/dashboard/new-simulation"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors font-bold shadow-lg shadow-indigo-500/30"
                    >
                        <Play size={18} fill="currentColor" />
                        Commencer un entretien
                    </Link>
                </div>
            ) : (
                <div className="overflow-x-auto pb-4">
                    <table className="w-full border-separate border-spacing-y-3">
                        <thead>
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Session</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Questions</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Score Global</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Statut</th>
                                <th className="text-right py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <motion.tbody
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.08
                                    }
                                }
                            }}
                        >
                            {sessions.map((session) => {
                                const scorePercent = getScorePercentage(session.total_score, session.max_score);
                                let scoreColor = '#ef4444'; // red-500
                                let ringColor = 'text-red-500';

                                if (scorePercent >= 80) {
                                    scoreColor = '#22c55e'; // green-500
                                    ringColor = 'text-green-500';
                                } else if (scorePercent >= 60) {
                                    scoreColor = '#eab308'; // yellow-500
                                    ringColor = 'text-yellow-500';
                                }

                                return (
                                    <motion.tr
                                        key={session.session_id}
                                        className="group relative"
                                        variants={{
                                            hidden: { opacity: 0, y: 30, scale: 0.98 },
                                            show: {
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                                transition: { type: "spring", stiffness: 300, damping: 25 }
                                            }
                                        }}
                                        whileHover={{ scale: 1.01, zIndex: 10 }}
                                    >
                                        <td className="py-5 px-6 bg-white/70 backdrop-blur-md rounded-l-2xl border-y border-l border-white/60 shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-500/5 group-hover:border-indigo-100 transition-all duration-300">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors text-lg">{session.role}</span>
                                                <span className="text-xs text-gray-400 font-mono tracking-wide">{session.session_id.slice(0, 8)}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 bg-white/70 backdrop-blur-md border-y border-white/60 shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-500/5 group-hover:border-indigo-100 transition-all duration-300">
                                            <div className="flex items-center gap-2 text-gray-500 font-medium">
                                                <Calendar size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                                                {formatDate(session.created_at)}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 bg-white/70 backdrop-blur-md border-y border-white/60 shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-500/5 group-hover:border-indigo-100 transition-all duration-300">
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                {session.question_count} Qs
                                            </span>
                                        </td>
                                        <td className="py-5 px-6 bg-white/70 backdrop-blur-md border-y border-white/60 shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-500/5 group-hover:border-indigo-100 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                {/* MiniGauge */}
                                                <div className="relative w-12 h-12 flex items-center justify-center">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                                                        <motion.circle
                                                            cx="24" cy="24" r="20"
                                                            stroke={scoreColor}
                                                            strokeWidth="4"
                                                            fill="transparent"
                                                            strokeDasharray={126}
                                                            strokeDashoffset={126 - (scorePercent / 100 * 126)}
                                                            strokeLinecap="round"
                                                            initial={{ strokeDashoffset: 126 }}
                                                            animate={{ strokeDashoffset: 126 - (scorePercent / 100 * 126) }}
                                                            transition={{ duration: 1.5, delay: 0.2, type: "spring", bounce: 0.2 }}
                                                        />
                                                    </svg>
                                                    <span className={`absolute text-[11px] font-black ${ringColor}`}>
                                                        {scorePercent}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className={`block text-sm font-bold ${ringColor}`}>
                                                        {scorePercent >= 80 ? 'Excellent' : scorePercent >= 60 ? 'Bon' : 'Faible'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Score IA</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 bg-white/70 backdrop-blur-md border-y border-white/60 shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-500/5 group-hover:border-indigo-100 transition-all duration-300">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_infinite]"></span>
                                                {session.status === 'completed' ? 'Terminé' : 'En cours'}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6 bg-white/70 backdrop-blur-md rounded-r-2xl border-y border-r border-white/60 shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-500/5 group-hover:border-indigo-100 transition-all duration-300 text-right">
                                            <Link
                                                href={`/dashboard/report/${session.session_id}`}
                                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-200 opacity-60 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"
                                            >
                                                Rapport
                                                <FileText size={16} />
                                            </Link>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </motion.tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
