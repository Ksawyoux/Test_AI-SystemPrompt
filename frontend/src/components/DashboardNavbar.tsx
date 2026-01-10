"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { LayoutDashboard, FileText, LogOut, Menu, X, ChevronRight, Sparkles, Settings, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardNavbarProps {
    user: User | null;
}

export default function DashboardNavbar({ user }: DashboardNavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const navItems = [
        { label: "Vue Générale", href: "/dashboard", icon: LayoutDashboard },
        { label: "Mes Campagnes", href: "/dashboard/campaigns", icon: FileText },
    ];

    return (
        <nav className="sticky top-0 z-40 w-full mb-8 pt-4 pb-2 px-4 bg-gray-50/80 backdrop-blur-md border-b border-gray-200/50 transition-all duration-300">
            <div className="max-w-7xl mx-auto relative flex items-center justify-between h-14">

                {/* Left: Logo */}
                <div className="flex-shrink-0 z-10">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105">
                            <span className="text-xs font-bold">AI</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-foreground">
                            Agentic Interviewer
                        </span>
                    </Link>
                </div>

                {/* Center: Floating Pill Navigation */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="flex items-center gap-1 bg-background/60 backdrop-blur-xl px-2 py-1.5 rounded-full border border-white/20 shadow-sm">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                                        ? "bg-secondary text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right: User Profile & Logout */}
                <div className="flex items-center gap-3 z-10">
                    {/* Desktop Profile - Agent Status Card */}
                    <div
                        className="hidden md:block relative z-50 group"
                        onMouseEnter={() => setMobileMenuOpen(false)}
                    >
                        <motion.button
                            className="flex items-center gap-3 p-1 pr-4 rounded-full hover:bg-white/50 transition-colors border border-transparent hover:border-white/20"
                            whileHover="hover"
                            initial="idle"
                            animate="idle"
                        >
                            <div className="relative">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px] shadow-sm overflow-hidden">
                                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-indigo-700 font-bold text-xs relative z-10">
                                        {user?.email?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <motion.div
                                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white z-20 flex items-center justify-center"
                                    variants={{
                                        idle: { scale: 1 },
                                        hover: { scale: 1.2 }
                                    }}
                                >
                                    <motion.div
                                        className="w-1.5 h-1.5 bg-white rounded-full"
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </motion.div>
                            </div>

                            <div className="text-right hidden lg:block">
                                <div className="text-sm font-bold text-gray-700 leading-tight">
                                    {user?.user_metadata?.full_name || "Agent"}
                                </div>
                                <div className="text-[10px] text-indigo-500 font-medium uppercase tracking-wider flex items-center justify-end gap-1">
                                    Online <span className="w-1 h-1 bg-green-500 rounded-full inline-block" />
                                </div>
                            </div>
                        </motion.button>

                        {/* ProfileExpand Slide-out Card */}
                        <div className="absolute top-full right-0 mt-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100">
                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl overflow-hidden p-4">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Agent Status</h3>
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-800">Level 1 Agent</div>
                                        <div className="text-xs text-gray-400">Experience: 1,200 XP</div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Link href="/dashboard/settings" className="flex items-center gap-3 w-full p-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                        <Settings size={16} />
                                        Settings
                                    </Link>
                                    <Link href="/dashboard/profile" className="flex items-center gap-3 w-full p-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                        <UserIcon size={16} />
                                        Profile
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full p-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden inline-flex items-center justify-center p-2 rounded-full bg-background border border-border/50 text-foreground shadow-sm"
                    >
                        <span className="sr-only">Open main menu</span>
                        {mobileMenuOpen ? (
                            <X className="block h-5 w-5" />
                        ) : (
                            <Menu className="block h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute left-4 right-4 top-20 bg-background/95 backdrop-blur-xl rounded-2xl border border-border/40 shadow-xl z-50 animate-in slide-in-from-top-2">
                    <div className="p-2 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                                        ? "bg-secondary text-foreground"
                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <item.icon className="w-5 h-5 mr-3" />
                                        {item.label}
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-foreground' : 'text-muted-foreground/30'}`} />
                                </Link>
                            );
                        })}
                    </div>
                    <div className="border-t border-border/40 p-4 bg-secondary/30 rounded-b-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-foreground">
                                        {user?.user_metadata?.full_name || "Compte"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-red-500"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
