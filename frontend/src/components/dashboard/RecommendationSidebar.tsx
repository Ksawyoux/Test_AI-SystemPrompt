"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Sparkles, ChevronRight, Activity, ArrowUpRight, BrainCircuit } from "lucide-react";
import { Recommendation } from "@/lib/api";

interface RecommendationSidebarProps {
    recommendations: Recommendation[];
    loading?: boolean;
}

export default function RecommendationSidebar({ recommendations, loading }: RecommendationSidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Mock range data for "Speaking Pace" visualization
    const pace = 138; // wpm
    const paceMin = 100;
    const paceMax = 200;
    const paceTargetMin = 130;
    const paceTargetMax = 150;
    const pacePercentage = ((pace - paceMin) / (paceMax - paceMin)) * 100;

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-xl flex flex-col h-full relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                    <BrainCircuit size={20} className="text-indigo-300" />
                </div>
                <div>
                    <h2 className="text-lg font-bold leading-tight">AI Coach</h2>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-indigo-200 font-medium">92% Confidence</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6 flex-1 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
                {/* Dynamic Range Bar Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs text-indigo-200 font-medium">Speaking Pace</span>
                        <span className="text-lg font-bold">{pace} <span className="text-xs font-normal text-white/60">wpm</span></span>
                    </div>
                    {/* Range Visual */}
                    <div className="h-6 w-full bg-white/10 rounded-full relative">
                        {/* Target Zone */}
                        <div
                            className="absolute top-0 bottom-0 bg-green-500/20 border-x border-green-500/30"
                            style={{
                                left: `${((paceTargetMin - paceMin) / (paceMax - paceMin)) * 100}%`,
                                width: `${((paceTargetMax - paceTargetMin) / (paceMax - paceMin)) * 100}%`
                            }}
                        />
                        {/* User Marker */}
                        <motion.div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-indigo-500 z-10"
                            initial={{ left: "0%" }}
                            animate={{ left: `${pacePercentage}%` }}
                            transition={{ duration: 1, type: "spring" }}
                        />
                        {/* Dotted Lines */}
                        <div className="absolute inset-0 flex justify-between px-2 items-center opacity-30">
                            {[...Array(5)].map((_, i) => <div key={i} className="w-px h-2 bg-white" />)}
                        </div>
                    </div>
                    <div className="mt-2 text-[10px] text-white/50 flex justify-between">
                        <span>Slow</span>
                        <span className="text-green-400">Target</span>
                        <span>Fast</span>
                    </div>
                </div>

                {/* Recommendations List */}
                {loading ? (
                    <div className="text-center py-8 text-white/40 animate-pulse">Analyzing patterns...</div>
                ) : recommendations.length > 0 ? (
                    recommendations.slice(0, 3).map((rec, i) => (
                        <div key={i} className="group cursor-pointer">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{rec.category}</h3>
                                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-300" />
                            </div>
                            <p className="text-xs text-indigo-100/70 leading-relaxed border-l-2 border-white/10 pl-3 py-1 group-hover:border-indigo-400 transition-colors">
                                {rec.content}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="text-white/40 text-sm">Start a simulation to generate insights.</div>
                )}
            </div>

            {/* Expandable Action Button */}
            <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 w-full py-3 bg-white text-indigo-900 font-bold rounded-xl text-sm hover:bg-indigo-50 transition-colors shadow-lg relative z-10 flex items-center justify-center gap-2"
            >
                <Sparkles size={16} className="text-indigo-600" />
                {isExpanded ? "Close Plan" : "View Personalized Plan"}
            </motion.button>

            {/* Expanded Overlay (Simplified for UI demo) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 bg-white z-20 p-6 text-gray-900 rounded-3xl overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Your Roadmap</h3>
                            <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <ChevronRight className="rotate-90" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                                            {step}
                                        </div>
                                        {step !== 3 && <div className="w-px h-full bg-indigo-100 my-1" />}
                                    </div>
                                    <div className="pb-6">
                                        <h4 className="font-bold text-sm">Phase {step}: Mastery</h4>
                                        <p className="text-xs text-gray-500 mt-1">Focus on advanced technical concepts and system design patterns.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
