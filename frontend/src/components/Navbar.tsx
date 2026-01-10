"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Dynamically import to avoid SSR issues
let supabaseClient: ReturnType<typeof import("@/lib/supabase/client").createClient> | null = null;

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<{ email?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [authEnabled, setAuthEnabled] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const initAuth = async () => {
            try {
                if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                    setLoading(false);
                    return;
                }

                const { createClient } = await import("@/lib/supabase/client");
                supabaseClient = createClient();
                setAuthEnabled(true);

                const { data: { user } } = await supabaseClient.auth.getUser();
                setUser(user);
                setLoading(false);

                const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event: string, session: any) => {
                    setUser(session?.user ?? null);
                });

                return () => subscription.unsubscribe();
            } catch {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const handleLogout = async () => {
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
            router.push("/");
            router.refresh();
        }
    };

    const navLinks = ["Product", "About", "Blog", "Pricing"];

    return (
        <nav className="fixed top-0 left-0 w-full z-50 pt-4 px-4 md:px-8 pointer-events-none">
            <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">

                {/* Left: Logo + Links (Pill Container) */}
                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-3 py-2 rounded-full border border-gray-200/50 shadow-sm">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground hover:opacity-80 transition-opacity pr-4 border-r border-gray-200">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                            AI
                        </div>
                    </Link>
                    <div className="hidden md:flex items-center gap-1 pl-2">
                        {navLinks.map((item) => (
                            <Link
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors rounded-full hover:bg-gray-100"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right: CTA */}
                <div className="flex items-center gap-3">
                    {loading ? (
                        <div className="w-28 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    ) : user && authEnabled ? (
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard" className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors shadow-lg">
                                Dashboard
                            </Link>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                        >
                            Get Free Demo
                        </Link>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-foreground bg-white rounded-full border border-gray-200 shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-4 right-4 bg-white rounded-2xl p-5 shadow-xl border border-gray-100 pointer-events-auto animate-in slide-in-from-top-4">
                    <div className="space-y-1">
                        {navLinks.map((item) => (
                            <Link
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-xl"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item}
                            </Link>
                        ))}
                        <hr className="my-3 border-gray-100" />
                        {!user && (
                            <Link
                                href="/login"
                                className="block w-full text-center bg-black text-white py-3 rounded-xl font-semibold"
                            >
                                Get Free Demo
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
