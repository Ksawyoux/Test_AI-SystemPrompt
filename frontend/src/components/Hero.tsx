"use client";

export default function Hero() {
    return (
        <section className="gradient-lavender pt-32 pb-20 px-6">
            <div className="max-w-6xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 mb-6 shadow-sm">
                    <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">New</span>
                    <span className="text-gray-600 text-sm">AI-powered interview platform</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
                    Hire smarter with
                    <br />
                    <span className="text-indigo-600">AI-powered interviews</span>
                </h1>

                {/* Subtitle */}
                <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                    Generate tailored interview questions, conduct live simulations, and get
                    instant AI scoring — all in one powerful platform. Elevate your{" "}
                    <strong>hiring process</strong> with seamless automation.
                </p>

                {/* CTA Button */}
                <a
                    href="#get-started"
                    className="inline-flex items-center gap-2 gradient-purple text-white px-8 py-4 rounded-full text-lg font-semibold hover:opacity-90 transition-smooth shadow-lg shadow-indigo-500/25"
                >
                    Get Started • It&apos;s Free
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </a>

                {/* Product Preview */}
                <div className="mt-16 relative">
                    <div className="flex flex-col lg:flex-row gap-6 justify-center items-center">
                        {/* Main Preview Card */}
                        <div className="bg-white rounded-2xl card-shadow p-4 max-w-2xl">
                            <div className="bg-gray-50 rounded-xl p-6">
                                {/* App Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">🎯</span>
                                        <span className="font-semibold text-gray-700">Interview Dashboard</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <span className="text-xs">👤</span>
                                        </div>
                                        <button className="bg-indigo-500 text-white text-xs px-3 py-1 rounded-full">Share</button>
                                    </div>
                                </div>

                                {/* Mock Interview Content */}
                                <div className="bg-gray-900 rounded-lg p-6 text-left">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-green-400 text-sm">●</span>
                                        <span className="text-white/60 text-sm">Live Interview</span>
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-2">
                                        Senior Software Engineer
                                    </h3>
                                    <p className="text-white/70 text-sm mb-4">
                                        AI-generated questions based on candidate resume and job requirements
                                    </p>
                                    <div className="flex gap-3">
                                        <button className="bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg">
                                            Start Interview
                                        </button>
                                        <button className="bg-white/10 text-white text-xs px-4 py-2 rounded-lg">
                                            View Questions
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Side Card */}
                        <div className="bg-white rounded-2xl card-shadow p-4 w-64">
                            <div className="bg-amber-100 rounded-xl p-6 flex flex-col items-center">
                                <div className="text-6xl mb-4">📊</div>
                                <div className="bg-gray-800 rounded-lg px-4 py-2 flex gap-2">
                                    <span className="text-white/60">📈</span>
                                    <span className="text-white/60">📉</span>
                                    <span className="text-white/60">📊</span>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="font-semibold text-gray-800">AI Scoring</p>
                                <p className="text-sm text-gray-500">Instant evaluation</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
