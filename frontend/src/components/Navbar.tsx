"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

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
                // Check if env vars are available
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

                // Listen for auth changes
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

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
            <div className="bg-background/90 backdrop-blur-md rounded-full px-6 py-3 nav-shadow flex items-center justify-between border border-border/50">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
                    <span className="text-2xl">🎯</span>
                    <span className="hidden sm:inline">Agentic Interviewer</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-muted-foreground hover:text-foreground transition-smooth text-sm font-medium">
                        Features
                    </a>
                    <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-smooth text-sm font-medium">
                        How It Works
                    </a>
                    <a href="#use-cases" className="text-muted-foreground hover:text-foreground transition-smooth text-sm font-medium">
                        Use Cases
                    </a>
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center space-x-4">
                        <Link href="/login" className="text-gray-600 hover:text-black font-medium transition-colors">
                            Log in
                        </Link>
                        <Link href="/signup" className="bg-black text-white px-5 py-2 rounded-full font-medium hover:bg-gray-800 transition-all hover:shadow-lg hover:-translate-y-0.5">
                            Sign up
                        </Link>
                    </div>

                    {loading ? (
                        <div className="w-20 h-10 bg-muted rounded-full animate-pulse"></div>
                    ) : user && authEnabled ? (
                        <>
                            {/* User Avatar */}
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-foreground max-w-[120px] truncate">
                                    {user.email}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-muted text-muted-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-muted/80 transition-smooth"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="hidden sm:block text-muted-foreground hover:text-foreground text-sm font-medium"
                            >
                                Login
                            </Link>
                            <Link
                                href="/signup"
                                className="gradient-purple text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-smooth"
                            >
                                Get Started
                            </Link>
                        </>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-foreground"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="md:hidden mt-2 bg-background rounded-2xl p-4 nav-shadow border border-border/50">
                    <a href="#features" className="block py-2 text-muted-foreground hover:text-foreground">Features</a>
                    <a href="#how-it-works" className="block py-2 text-muted-foreground hover:text-foreground">How It Works</a>
                    <a href="#use-cases" className="block py-2 text-muted-foreground hover:text-foreground">Use Cases</a>
                    {!user && (
                        <>
                            <hr className="my-2 border-border" />
                            <Link href="/login" className="block py-2 text-muted-foreground hover:text-foreground">Login</Link>
                            <Link href="/signup" className="block py-2 text-primary font-semibold">Sign Up</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
