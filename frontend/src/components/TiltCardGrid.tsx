"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface TiltCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    bgColor: string;
    iconBgColor: string;
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function TiltCard({ icon, title, description, bgColor, iconBgColor }: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [target, setTarget] = useState({ x: 0, y: 0 });
    const [isHover, setIsHover] = useState(false);
    const animationRef = useRef<number | null>(null);

    // Animation loop for inertia
    useEffect(() => {
        let running = true;
        function animate() {
            setTilt(prev => {
                const t = 0.18; // Easing factor for inertia
                return {
                    x: lerp(prev.x, target.x, t),
                    y: lerp(prev.y, target.y, t),
                };
            });
            if (running) animationRef.current = requestAnimationFrame(animate);
        }
        animationRef.current = requestAnimationFrame(animate);
        return () => {
            running = false;
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [target.x, target.y]);

    // Mouse move handler
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = clamp((x / rect.width) * 2 - 1, -1, 1);
        const py = clamp((y / rect.height) * 2 - 1, -1, 1);
        // Max tilt: 10deg X, 12deg Y
        const maxX = 10;
        const maxY = 12;
        setTarget({ x: py * maxX, y: px * maxY });
    }, []);

    // Mouse leave handler
    const handleMouseLeave = useCallback(() => {
        setIsHover(false);
        setTarget({ x: 0, y: 0 });
    }, []);

    // Mouse enter handler
    const handleMouseEnter = useCallback(() => {
        setIsHover(true);
    }, []);

    const transform = `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`;

    return (
        <div
            ref={ref}
            className={`relative overflow-hidden rounded-[24px] border border-gray-200 bg-white p-8 cursor-pointer transition-shadow duration-300 ${isHover ? 'shadow-2xl' : 'shadow-lg'}`}
            style={{
                transform,
                willChange: "transform",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
        >
            {/* Icon */}
            <div className={`w-14 h-14 ${iconBgColor} rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 ${isHover ? 'scale-110' : ''}`}>
                {icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">{description}</p>

            {/* Shine effect on hover */}
            <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isHover ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)`,
                }}
            />
        </div>
    );
}

interface TiltCardGridProps {
    cards: {
        icon: React.ReactNode;
        title: string;
        description: string;
        bgColor: string;
        iconBgColor: string;
    }[];
}

export default function TiltCardGrid({ cards }: TiltCardGridProps) {
    return (
        <div className="grid md:grid-cols-3 gap-6">
            {cards.map((card, i) => (
                <TiltCard
                    key={i}
                    icon={card.icon}
                    title={card.title}
                    description={card.description}
                    bgColor={card.bgColor}
                    iconBgColor={card.iconBgColor}
                />
            ))}
        </div>
    );
}
