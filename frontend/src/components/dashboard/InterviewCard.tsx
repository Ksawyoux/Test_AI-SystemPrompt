"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Play } from "lucide-react";
import { RecentInterview } from "@/lib/api";

interface InterviewCardProps {
    interview: RecentInterview;
}

export default function InterviewCard({ interview }: InterviewCardProps) {
    const isOutlier = interview.score > 95 || interview.score < 30;
    const isSuccess = interview.score >= 70;

    // Calculate color based on score
    const scoreColor = interview.score >= 80 ? "text-green-500" : interview.score >= 60 ? "text-yellow-500" : "text-red-500";
    const strokeColor = interview.score >= 80 ? "#22c55e" : interview.score >= 60 ? "#eab308" : "#ef4444";

    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: "0 12px 24px -10px rgba(0,0,0,0.08)" }}
            className={`group relative p-5 rounded-2xl border transition-all cursor-pointer bg-white ${isOutlier ? "border-indigo-200 ring-1 ring-indigo-50" : "border-gray-100 hover:border-gray-200"
                }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${isSuccess ? "bg-green-50 text-green-600" :
                        interview.score < 30 ? "bg-red-50 text-red-600" :
                            "bg-gray-50 text-gray-600"
                        }`}>
                        {interview.role.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {interview.role}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">{interview.date}</p>
                    </div>
                </div>

                {/* Micro-Gauge */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="18" stroke="#f3f4f6" strokeWidth="3" fill="transparent" />
                        <motion.circle
                            cx="24" cy="24" r="18"
                            stroke={strokeColor}
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={113}
                            strokeDashoffset={113}
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: 113 }}
                            whileInView={{ strokeDashoffset: 113 - (Math.min(interview.score, 100) / 100 * 113) }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </svg>
                    <span className={`absolute text-[10px] font-bold ${scoreColor}`}>
                        {interview.score > 999 ? '99+' : interview.score}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md">
                        <Clock size={11} className="text-gray-400" />
                        25m
                    </span>
                    {isOutlier && (
                        <span className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-1 rounded-md">
                            <AlertTriangle size={11} />
                            Insight
                        </span>
                    )}
                </div>

                {/* Hover Action */}
                <motion.div
                    className="flex items-center gap-1 text-xs text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    Review <ArrowRight size={12} />
                </motion.div>
            </div>
        </motion.div>
    );
}
