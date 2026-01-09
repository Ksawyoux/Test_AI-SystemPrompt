"use client";

const features = [
    {
        icon: "🧠",
        title: "Smart Question Generation",
        description: "AI analyzes resumes and job descriptions to create tailored, relevant interview questions instantly.",
        color: "bg-pink-100",
    },
    {
        icon: "🎙️",
        title: "Live Interview Mode",
        description: "Conduct voice-enabled interview simulations with real-time transcription and feedback.",
        color: "bg-amber-100",
    },
    {
        icon: "📊",
        title: "Instant AI Scoring",
        description: "Get detailed evaluation reports with strengths, weaknesses, and hiring recommendations.",
        color: "bg-blue-100",
    },
];

export default function Features() {
    return (
        <section id="features" className="py-24 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        The ultimate toolkit for
                        <br />
                        hiring teams
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Everything you need to streamline interviews and make better hiring decisions — all in a single, easy-to-use platform.
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-smooth cursor-pointer"
                        >
                            {/* Icon Area */}
                            <div className={`${feature.color} rounded-xl p-6 mb-6 relative overflow-hidden`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-white/50 rounded-lg p-2">
                                        <span className="text-gray-600">✏️</span>
                                    </div>
                                    <div className="bg-white/50 rounded-lg p-2">
                                        <span className="text-gray-600">📝</span>
                                    </div>
                                    <div className="bg-white/50 rounded-lg p-2">
                                        <span className="text-gray-600">🔍</span>
                                    </div>
                                </div>
                                <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
