"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { motion } from "framer-motion";
import { PerformanceDataPoint } from "@/lib/api";

interface PerformanceChartProps {
    data: PerformanceDataPoint[];
    loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 text-sm ring-1 ring-gray-100">
                <p className="font-bold text-gray-900 mb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-500 capitalize">{entry.name.replace('_', ' ')}:</span>
                            <span className="font-mono font-bold text-gray-900">{entry.value}</span>
                        </div>
                    ))}
                </div>
                {/* Actionable Insight (Mocked for generic context) */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                        ✨ Top Insight
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Consistency is improving. Focus on technical depth to boost the purple line.
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function PerformanceChart({ data, loading }: PerformanceChartProps) {
    if (loading) {
        return (
            <div className="h-[350px] w-full flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl animate-pulse">
                Loading chart visualization...
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-[350px] w-full flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                No performance data available yet.
            </div>
        );
    }

    // Mocking extra data if missing for visualization demo
    const enhancedData = data.map(d => ({
        ...d,
        technical_score: d.technical_score || Math.max(0, d.score - Math.floor(Math.random() * 15)),
        communication_score: d.communication_score || Math.min(100, d.score + Math.floor(Math.random() * 10))
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-[350px] w-full"
        >
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enhancedData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
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
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />

                    {/* Role Average Benchmark Line */}
                    <ReferenceLine y={75} stroke="#e2e8f0" strokeDasharray="3 3" label={{ position: 'right', value: 'Avg', fill: '#cbd5e1', fontSize: 10 }} />

                    {/* Main Score Area */}
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: "#8b5cf6" }}
                    />

                    {/* Secondary Metrics (Dotted/Thinner) */}
                    <Line
                        type="monotone"
                        dataKey="technical_score"
                        stroke="#c084fc"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 4, fill: "#c084fc" }}
                    />
                    <Line
                        type="monotone"
                        dataKey="communication_score"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 4, fill: "#38bdf8" }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
