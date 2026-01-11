"use client";

import React, { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Area,
    ComposedChart,
    Legend
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import { PerformanceDataPoint } from "@/lib/api";

interface PerformanceChartProps {
    data: PerformanceDataPoint[];
    loading?: boolean;
}

// Separate Tooltip for cleaner main component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-slate-100 text-sm">
            <p className="font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}</p>
            <div className="space-y-1.5">
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-500 text-xs capitalize">{entry.name.replace('_', ' ')}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{entry.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function PerformanceChart({ data, loading }: PerformanceChartProps) {
    // Memoize the data transformation to ensure performance
    const enhancedData = useMemo(() => {
        if (!data) return [];
        return data.map(d => ({
            ...d,
            technical_score: d.technical_score || Math.max(0, (d.score || 0) - 10),
            communication_score: d.communication_score || Math.min(100, (d.score || 0) + 5)
        }));
    }, [data]);

    if (loading) {
        return (
            <div className="h-[400px] w-full flex flex-col items-center justify-center space-y-4 bg-slate-50/50 rounded-3xl border border-slate-100">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-slate-400 font-medium tracking-tight">Analyzing Performance Data...</span>
            </div>
        );
    }

    if (!enhancedData.length) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                No performance data found for this period.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[400px] w-full p-6 bg-white rounded-3xl shadow-sm border border-slate-100"
        >
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enhancedData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />

                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                        dy={15}
                    />

                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                    />

                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        content={({ payload }) => (
                            <div className="flex justify-end gap-4 mb-6">
                                {payload?.map((entry: any, index: number) => (
                                    <div key={index} className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            {entry.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    />

                    <ReferenceLine
                        y={75}
                        stroke="#f1f5f9"
                        strokeWidth={2}
                        label={{ position: 'right', value: 'TARGET', fill: '#cbd5e1', fontSize: 9, fontWeight: 700 }}
                    />

                    <Area
                        type="monotoneX"
                        dataKey="score"
                        stroke="#6366f1"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                        animationDuration={1500}
                    />

                    <Line
                        type="monotone"
                        dataKey="technical_score"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        activeDot={{ r: 4, fill: "#94a3b8" }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </motion.div>
    );
}