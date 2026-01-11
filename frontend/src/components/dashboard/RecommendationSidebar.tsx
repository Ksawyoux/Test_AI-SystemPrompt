"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUpRight, BrainCircuit, Zap, X, MessageSquare, Target } from "lucide-react";
import { Recommendation } from "@/lib/api";

interface RecommendationSidebarProps {
    recommendations: Recommendation[];
    loading?: boolean;
}

export default function RecommendationSidebar({ recommendations, loading }: RecommendationSidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="bg-[#0f111a] border border-white/10 rounded-3xl p-5 text-white shadow-2xl flex flex-col h-full max-h-[600px] relative overflow-hidden">
            {/* Background Aesthetic Blur */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg ring-1 ring-white/20">
                    <BrainCircuit size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-md font-bold leading-tight">AI Insights</h2>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-tighter">Live Analysis</span>
                    </div>
                </div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-4 flex-1 relative z-10 overflow-y-auto pr-1 custom-scrollbar">
                <div className="flex items-center gap-2 px-1 mb-2">
                    <Zap size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Strategic Actions</span>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 w-full bg-white/5 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3"
                    >
                        {recommendations.length > 0 ? (
                            recommendations.map((rec, i) => (
                                <motion.div
                                    key={i}
                                    variants={itemVariants}
                                    className="group bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 rounded-2xl p-4 transition-all duration-200"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {rec.category.toLowerCase().includes('technical') ?
                                                <Target size={12} className="text-indigo-400" /> :
                                                <MessageSquare size={12} className="text-purple-400" />
                                            }
                                            <span className="text-[10px] font-black uppercase tracking-tight text-indigo-300/80">
                                                {rec.category}
                                            </span>
                                        </div>
                                        <ArrowUpRight size={14} className="text-white/10 group-hover:text-white transition-colors" />
                                    </div>
                                    <p className="text-[12px] text-white/70 leading-relaxed font-medium">
                                        {rec.content}
                                    </p>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-30 text-xs italic">
                                No recommendations generated yet.
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Action Button */}
            <motion.button
                onClick={() => setIsExpanded(true)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 w-full py-3.5 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600 hover:to-purple-600 border border-white/10 text-white font-bold rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
            >
                <Sparkles size={14} />
                View Full Roadmap
            </motion.button>

            {/* Expanded Modal Overlay */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 bg-[#0f111a] z-50 p-6 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black">Coaching Plan</h3>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-6 overflow-y-auto pr-2">
                            {recommendations.map((rec, idx) => (
                                <div key={idx} className="border-l-2 border-indigo-500/30 pl-4 py-1">
                                    <h4 className="text-xs font-black uppercase text-indigo-400 mb-1">{rec.category}</h4>
                                    <p className="text-sm text-white/80 leading-relaxed">{rec.content}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}