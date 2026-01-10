"use client";

import Link from "next/link";

import { Plus, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { getDashboardStats, DashboardStats } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import InterviewCard from "@/components/dashboard/InterviewCard";
import RecommendationSidebar from "@/components/dashboard/RecommendationSidebar";


export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchUserAndStats() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const currentUserId = user?.id || null;
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

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Track your progress and get personalized AI recommendations.</p>
                </div>
                <Link
                    href="/dashboard/new-simulation"
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30"
                >
                    <Plus size={18} />
                    <span>New Simulation</span>
                </Link>
            </div>

            {/* Main Grid: Chart + Sidebar */}
            <div className="grid lg:grid-cols-3 gap-6 h-auto lg:h-[450px]">
                {/* Performance Chart Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Performance Trends</h2>
                        <select className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 outline-none focus:border-indigo-500">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <PerformanceChart data={performanceData} loading={loading} />
                    </div>
                </motion.div>

                {/* AI Sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="h-full"
                >
                    <RecommendationSidebar recommendations={recommendations} loading={loading} />
                </motion.div>
            </div>

            {/* Recent Interviews Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-transparent"
            >
                <div className="flex items-center justify-between mb-6 px-1">
                    <h2 className="text-lg font-bold text-gray-900">Recent Interviews</h2>
                    <Link href="/dashboard/campaigns" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
                        View All <ArrowRight size={16} />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : recentSimulations.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {recentSimulations.map((sim, i) => (
                            <motion.div
                                key={sim.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (i * 0.1) }}
                            >
                                <InterviewCard interview={sim} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
                        No reviews yet. Start a simulation to see your progress!
                    </div>
                )}
            </motion.div>
        </div>
    );
}
