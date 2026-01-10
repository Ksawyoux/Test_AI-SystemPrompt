"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface NeuralTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    characterCount?: number;
    maxCharacters?: number;
}

export function NeuralTextArea({ className, characterCount, maxCharacters, ...props }: NeuralTextAreaProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        containerRef.current.style.setProperty("--mouse-x", `${x}px`);
        containerRef.current.style.setProperty("--mouse-y", `${y}px`);
    };

    return (
        <div
            ref={containerRef}
            className="relative group p-[2px] rounded-xl overflow-hidden"
            onMouseMove={handleMouseMove}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        >
            {/* Animated Gradient Border */}
            <div
                className={`absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'group-hover:opacity-50'}`}
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 102, 241, 0.6), transparent 40%),
                                 conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, #6366f1)`
                }}
            />

            {/* Inner Content */}
            <div className="relative bg-white/90 backdrop-blur-xl rounded-[10px] w-full h-full">
                <textarea
                    {...props}
                    className={`w-full h-full p-5 bg-transparent rounded-[10px] focus:outline-none resize-none transition-colors ${className}`}
                />
            </div>

            {/* Spring Counter */}
            {characterCount !== undefined && (
                <motion.div
                    className="absolute bottom-4 right-4"
                    animate={{ scale: isFocused ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    <div className="px-3 py-1 bg-white/80 backdrop-blur text-xs font-mono font-medium text-indigo-600 rounded-full border border-indigo-100 shadow-sm pointer-events-none">
                        <span className={maxCharacters && characterCount > maxCharacters ? "text-red-500" : "text-indigo-600"}>
                            {characterCount} chars
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
