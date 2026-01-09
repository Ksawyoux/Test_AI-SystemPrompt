"use client";

const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Use Cases", href: "#use-cases" },
];

const allPages = [
    { label: "Get Started", href: "#", badge: "New" },
    { label: "About Us", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Privacy Policy", href: "#" },
];

const socialLinks = [
    { icon: "𝕏", href: "#", label: "Twitter" },
    { icon: "in", href: "#", label: "LinkedIn" },
    { icon: "▶", href: "#", label: "YouTube" },
];

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-4 gap-12">
                    {/* Logo & Social */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-2xl">🎯</span>
                            <span className="font-bold text-xl">Agentic Interviewer</span>
                        </div>

                        <p className="text-gray-400 text-sm mb-6">
                            AI-powered interview platform for modern hiring teams.
                        </p>

                        <div className="text-gray-400 text-sm mb-4">Follow us on:</div>
                        <div className="flex gap-3">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-smooth"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold mb-4 text-lg">Quick Links</h4>
                        <ul className="space-y-3">
                            {quickLinks.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-smooth text-sm"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* All Pages */}
                    <div>
                        <h4 className="font-bold mb-4 text-lg">All Pages</h4>
                        <ul className="space-y-3">
                            {allPages.map((link, index) => (
                                <li key={index} className="flex items-center gap-2">
                                    <a
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-smooth text-sm"
                                    >
                                        {link.label}
                                    </a>
                                    {link.badge && (
                                        <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                            {link.badge}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-bold mb-4 text-lg">Stay Updated</h4>
                        <p className="text-gray-400 text-sm mb-4">
                            Get the latest updates on AI-powered hiring.
                        </p>
                        <div className="flex">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 bg-gray-800 text-white text-sm px-4 py-2 rounded-l-lg border-0 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button className="bg-indigo-500 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-600 transition-smooth text-sm">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © 2026 Agentic Interviewer. All rights reserved.
                    </p>
                    <p className="text-gray-500 text-sm">
                        Powered by <span className="text-indigo-400">Google Gemini AI</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
