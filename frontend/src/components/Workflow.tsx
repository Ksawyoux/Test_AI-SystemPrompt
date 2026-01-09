"use client";

const steps = [
    {
        number: "01",
        title: "Upload Documents",
        description: "Upload your candidate's resume and job description with just a click. Set up your interview in seconds.",
    },
    {
        number: "02",
        title: "AI Generates Questions",
        description: "Our AI analyzes the documents and creates tailored interview questions with difficulty levels and scoring criteria.",
    },
    {
        number: "03",
        title: "Interview & Report",
        description: "Conduct live interviews with voice support and receive instant AI-generated evaluation reports.",
    },
];

export default function Workflow() {
    return (
        <section id="how-it-works" className="py-24 px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Steps */}
                    <div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-12">
                            Simplify your
                            <br />
                            hiring workflow
                        </h2>

                        <div className="space-y-8">
                            {steps.map((step, index) => (
                                <div key={index} className="flex gap-6">
                                    <div className="text-gray-300 font-bold text-2xl">{step.number}</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{step.title}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Platform badges */}
                        <div className="mt-12 flex items-center gap-4 text-gray-500 text-sm">
                            <span>Available on Web</span>
                            <div className="flex gap-2">
                                <span className="bg-gray-200 px-2 py-1 rounded text-xs">🌐</span>
                                <span className="bg-gray-200 px-2 py-1 rounded text-xs">💻</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: App Preview */}
                    <div className="relative">
                        <div className="bg-white rounded-2xl card-shadow p-4">
                            {/* App Header */}
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-lg">≡</span>
                                    <span className="text-gray-400 text-sm">Agency / Interview</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 rounded-full bg-orange-400"></div>
                                    <div className="w-6 h-6 rounded-full bg-blue-400"></div>
                                    <button className="bg-indigo-500 text-white text-xs px-3 py-1 rounded-full">Share</button>
                                </div>
                            </div>

                            {/* Main App Content */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* Sidebar */}
                                <div className="bg-gray-100 rounded-lg p-3 space-y-3">
                                    <div className="bg-indigo-500 text-white p-2 rounded-lg text-xs">📋</div>
                                    <div className="bg-white p-2 rounded text-gray-400 text-xs">✏️</div>
                                    <div className="bg-white p-2 rounded text-gray-400 text-xs">📝</div>
                                    <div className="bg-white p-2 rounded text-gray-400 text-xs">📊</div>
                                    <div className="bg-white p-2 rounded text-gray-400 text-xs">🔍</div>
                                </div>

                                {/* Main Content */}
                                <div className="col-span-2 bg-indigo-500 rounded-lg p-4 text-white">
                                    <div className="flex justify-between mb-4">
                                        <span className="font-semibold">Agentic.</span>
                                        <span className="text-indigo-200">≡</span>
                                    </div>
                                    <p className="text-sm mb-4">Welcome back,<br /><strong>Mike.</strong></p>
                                    <div className="bg-amber-300 rounded-lg p-3 flex justify-center">
                                        <div className="w-16 h-16 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Properties Panel */}
                            <div className="absolute -right-4 top-1/4 bg-white rounded-lg card-shadow p-3 text-xs w-32">
                                <div className="font-semibold text-gray-700 mb-2">Frame</div>
                                <div className="space-y-2 text-gray-500">
                                    <div className="flex justify-between">
                                        <span>Position</span>
                                        <span className="bg-gray-100 px-2 rounded">X 15</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Layout</span>
                                        <span className="bg-gray-100 px-2 rounded">H 15</span>
                                    </div>
                                </div>
                            </div>

                            {/* User Badge */}
                            <div className="absolute -right-2 top-8 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                <span className="w-4 h-4 bg-amber-400 rounded-full text-[10px] flex items-center justify-center">JJ</span>
                                Mike
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
