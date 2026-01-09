"use client";

import { useEffect, useState, useRef } from "react";

interface AnimatedAvatarProps {
    isSpeaking: boolean;
    avatarImage?: string;
    size?: number;
}

export default function AnimatedAvatar({
    isSpeaking,
    avatarImage = "/aya-avatar.png",
    size = 320
}: AnimatedAvatarProps) {
    const [mouthOpen, setMouthOpen] = useState(0);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (isSpeaking) {
            // Animate mouth while speaking
            const animate = () => {
                // Random mouth movement for natural speaking effect
                setMouthOpen(Math.random() * 0.8 + 0.2);
                animationRef.current = requestAnimationFrame(() => {
                    setTimeout(animate, 80 + Math.random() * 80);
                });
            };
            animate();
        } else {
            setMouthOpen(0);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isSpeaking]);

    return (
        <div
            className="relative"
            style={{ width: size, height: size }}
        >
            {/* Avatar Image */}
            <img
                src={avatarImage}
                alt="AI Interviewer"
                className={`w-full h-full object-cover rounded-2xl shadow-2xl transition-all duration-300 ${isSpeaking ? "scale-[1.02]" : "scale-100"
                    }`}
            />

            {/* Speaking Glow Effect */}
            {isSpeaking && (
                <div
                    className="absolute -inset-3 rounded-3xl -z-10 animate-pulse"
                    style={{
                        background: `radial-gradient(circle, rgba(34, 197, 94, ${0.2 + mouthOpen * 0.2}) 0%, transparent 70%)`
                    }}
                />
            )}

            {/* Audio Wave Indicator */}
            {isSpeaking && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 bg-green-500 rounded-full transition-all duration-100"
                            style={{
                                height: `${8 + Math.random() * mouthOpen * 24}px`,
                                opacity: 0.6 + mouthOpen * 0.4
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Subtle Ring Animation */}
            {isSpeaking && (
                <>
                    <div
                        className="absolute inset-0 rounded-2xl border-2 border-green-500/30 animate-ping"
                        style={{ animationDuration: '2s' }}
                    />
                    <div className="absolute inset-0 rounded-2xl border-2 border-green-500/50" />
                </>
            )}

            {/* Idle Breathing Animation */}
            {!isSpeaking && (
                <div
                    className="absolute inset-0 rounded-2xl border-2 border-white/10 animate-pulse"
                    style={{ animationDuration: '3s' }}
                />
            )}
        </div>
    );
}
