"use client";

const audiences = [
    "Recruiters",
    "HR Teams",
    "Hiring Managers",
    "Startups",
    "Product Teams",
    "Enterprises",
];

export default function UseCases() {
    return (
        <section id="use-cases" className="py-24 px-6 bg-gray-100">
            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left: App Preview */}
                    <div className="relative">
                        <div className="bg-gray-900 rounded-2xl p-6 text-white max-w-sm">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <span className="font-bold">Agentic.</span>
                                <span className="text-gray-400">≡</span>
                            </div>

                            <p className="text-white/80 text-sm mb-6">Welcome to your interview dashboard</p>

                            {/* Interview Cards */}
                            <div className="space-y-3">
                                <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-2xl">
                                        👨‍💻
                                    </div>
                                    <div>
                                        <p className="font-semibold">Senior Developer</p>
                                        <p className="text-indigo-400 text-sm">10 questions</p>
                                    </div>
                                </div>

                                <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-2xl">
                                        📈
                                    </div>
                                    <div>
                                        <p className="font-semibold">Product Manager</p>
                                        <p className="text-indigo-400 text-sm">8 questions</p>
                                    </div>
                                </div>

                                <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center text-2xl">
                                        🎨
                                    </div>
                                    <div>
                                        <p className="font-semibold">UX Designer</p>
                                        <p className="text-indigo-400 text-sm">7 questions</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Color Picker */}
                        <div className="absolute -right-4 top-16 bg-white rounded-lg card-shadow p-3 text-xs">
                            <div className="font-semibold text-gray-700 mb-2">Difficulty</div>
                            <div className="flex gap-1">
                                <div className="w-5 h-5 rounded-full bg-green-500"></div>
                                <div className="w-5 h-5 rounded-full bg-yellow-500"></div>
                                <div className="w-5 h-5 rounded-full bg-orange-500"></div>
                                <div className="w-5 h-5 rounded-full bg-red-500"></div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Content */}
                    <div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                            The perfect solution
                            <br />
                            for every team
                        </h2>

                        <p className="text-gray-600 text-lg mb-8">
                            Discover how our AI interview platform fits your needs, whether you&apos;re a startup, growing team, or enterprise.
                        </p>

                        {/* Audience Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {audiences.map((audience, index) => (
                                <div key={index} className="flex items-center gap-3 text-gray-700">
                                    <span className="text-indigo-500">→</span>
                                    <span>{audience}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
