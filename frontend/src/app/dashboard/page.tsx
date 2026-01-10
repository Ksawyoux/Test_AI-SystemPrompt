"use client";

import Link from "next/link";

import { Plus, Layout, ArrowRight, Zap, Clock, FileCheck } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useState, useEffect } from "react";
import { getDashboardStats, DashboardStats } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        async function fetchUserAndStats() {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                const currentUserId = user?.id || null;
                setUserId(currentUserId);

                // Fetch stats filtered by user_id
                const data = await getDashboardStats(currentUserId || undefined);
                setStats(data);
            } catch (error) {
                console.error("Failed to load stats", error);
            } finally {
                setLoading(false);
            }
        }
        fetchUserAndStats();
    }, [supabase]);

    const performanceData = stats?.performance_data || [];
    const recentSimulations = stats?.recent_interviews || [];
    const recommendations = stats?.recommendations || [];

    // Helper for category colors
    const getCategoryColor = (cat: string) => {
        if (cat.includes("Technical")) return "text-purple-200";
        if (cat.includes("Communication")) return "text-blue-200";
        return "text-green-200";
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
                    <p className="text-[var(--muted-foreground)]">Track your progress and get personalized AI recommendations.</p>
                </div>
                <Link
                    href="/dashboard/new-simulation"
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/30"
                >
                    <Plus size={18} />
                    <span>New Simulation</span>
                </Link>
            </div>

            {/* Main Stats Grid */}
            <div className="grid lg:grid-cols-3 gap-6">

                {/* Performance Chart */}
                <div className="lg:col-span-2 bg-[var(--card)] p-6 rounded-2xl shadow-sm border border-[var(--border)] transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-[var(--foreground)]">Performance Trends</h2>
                        <select className="text-sm border border-[var(--border)] rounded-lg px-3 py-1 text-[var(--muted-foreground)] bg-[var(--card)] outline-none focus:border-purple-500">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    {loading ? (
                        <div className="h-[300px] w-full flex items-center justify-center text-gray-400">Loading chart...</div>
                    ) : performanceData.length > 0 ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] w-full flex items-center justify-center text-[var(--muted-foreground)] bg-[var(--secondary)] rounded-xl">
                            No performance data yet. Start a simulation!
                        </div>
                    )}
                </div>

                {/* AI Recommendations Section - NEW */}
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-6 rounded-2xl shadow-lg text-white flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Zap size={20} className="text-yellow-400" />
                        </div>
                        <h2 className="text-lg font-bold">AI Recommendations</h2>
                    </div>

                    <div className="space-y-4 flex-1">
                        {loading ? (
                            <div className="text-white/50 text-sm">Loading insights...</div>
                        ) : recommendations.length > 0 ? (
                            recommendations.map((rec, i) => (
                                <div key={i} className="bg-white/10 p-4 rounded-xl border border-white/5 hover:bg-white/20 transition-colors">
                                    <h3 className={`font-semibold text-sm mb-1 ${getCategoryColor(rec.category)}`}>{rec.category}</h3>
                                    <p className="text-xs text-gray-300 leading-relaxed">
                                        {rec.content}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="text-white/70 text-sm">
                                Complete a simulation to get personalized insights!
                            </div>
                        )}
                    </div>

                    <button className="mt-6 w-full py-2.5 bg-white text-purple-900 font-bold rounded-xl text-sm hover:bg-gray-100 transition-colors">
                        View Personalized Plan
                    </button>
                </div>
            </div>

            {/* Recent Simulations List */}
            <div className="bg-[var(--card)] p-6 rounded-2xl shadow-sm border border-[var(--border)] transition-colors">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-[var(--foreground)]">Recent Interviews</h2>
                    <Link href="/dashboard/campaigns" className="text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1">
                        View All <ArrowRight size={16} />
                    </Link>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-[var(--muted-foreground)]">Loading simulations...</div>
                ) : recentSimulations.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentSimulations.map((sim) => (
                            <div key={sim.id} className="group p-4 rounded-xl border border-[var(--border)] hover:border-purple-400 hover:bg-purple-500/10 transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 font-bold text-sm">
                                            AI
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[var(--foreground)] group-hover:text-purple-500 transition-colors">
                                                {sim.role || "Practice Interview"}
                                            </h3>
                                            <span className="text-xs text-[var(--muted-foreground)]">{sim.date}</span>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${sim.score >= 80 ? 'bg-green-500/20 text-green-500' :
                                        sim.score >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                                            'bg-red-500/20 text-red-500'
                                        }`}>
                                        {sim.score}/100
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mt-2">
                                    <span className="flex items-center gap-1"><Clock size={12} /> 25m</span>
                                    <span className="flex items-center gap-1"><FileCheck size={12} /> Complete</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-[var(--secondary)] rounded-xl text-[var(--muted-foreground)]">
                        No recent interviews found.
                    </div>
                )}
            </div>
        </div>
    );
}
