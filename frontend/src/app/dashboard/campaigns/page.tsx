"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, FileText, Calendar, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
    const supabase = createClient();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            // Fetch all responses grouped by session_id
            const { data, error } = await supabase
                .from("interview_responses")
                .select("*")
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
                let role = "Interview Session";

                responses.forEach((r: any) => {
                    if (r.evaluation) {
                        totalScore += r.evaluation.score || 0;
                        maxScore += r.evaluation.max_points || 10;
                    }
                    // Try to extract role from question context
                    if (r.question_text && r.question_text.includes("role")) {
                        role = "Interview";
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
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Mes Campagnes d&apos;entretien</h1>
                    <p className="text-[var(--muted-foreground)]">Gérez et analysez vos sessions d&apos;interviews</p>
                </div>
                <Link
                    href="/dashboard/new-simulation"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                    <Play size={16} />
                    Nouvelle Simulation
                </Link>
            </div>

            {sessions.length === 0 ? (
                <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] p-12 text-center">
                    <div className="w-16 h-16 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-[var(--muted-foreground)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Aucune session</h3>
                    <p className="text-[var(--muted-foreground)] mb-6">Vous n&apos;avez pas encore effectué d&apos;entretien.</p>
                    <Link
                        href="/dashboard/new-simulation"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        <Play size={16} />
                        Commencer un entretien
                    </Link>
                </div>
            ) : (
                <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--secondary)] border-b border-[var(--border)]">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Session</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Date</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Questions</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Score Global</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Statut</th>
                                    <th className="text-right py-4 px-6 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {sessions.map((session) => {
                                    const scorePercent = getScorePercentage(session.total_score, session.max_score);
                                    return (
                                        <tr key={session.session_id} className="hover:bg-[var(--secondary)]/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-[var(--foreground)]">{session.role}</span>
                                                    <span className="text-xs text-[var(--muted-foreground)] font-mono">{session.session_id.slice(0, 8)}...</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm">
                                                    <Calendar size={14} />
                                                    {formatDate(session.created_at)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-[var(--foreground)] font-medium">{session.question_count}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-bold ${scorePercent >= 80 ? 'bg-green-500/20 text-green-500' :
                                                    scorePercent >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                                                        'bg-red-500/20 text-red-500'
                                                    }`}>
                                                    {session.total_score}/{session.max_score} ({scorePercent}%)
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize bg-blue-500/20 text-blue-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    Terminé
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/dashboard/report/${session.session_id}`}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--foreground)] bg-[var(--secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                                                    >
                                                        <FileText size={14} />
                                                        Voir Rapport
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
