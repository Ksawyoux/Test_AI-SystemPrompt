"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { LayoutDashboard, FileText, LogOut, Menu, X } from "lucide-react";

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
        <nav className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-40 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-[var(--foreground)]">
                                <span className="text-2xl">🎯</span>
                                <span className="hidden md:block">Agentic Interviewer</span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:ml-6 md:flex md:space-x-8">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive
                                            ? "border-[var(--primary)] text-[var(--foreground)]"
                                            : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4 mr-2" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-3">

                        <div className="hidden md:flex md:items-center md:ml-2">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-[var(--muted-foreground)]">
                                    {user?.email}
                                </span>
                                <div className="h-8 w-8 rounded-full bg-[var(--primary)] bg-opacity-20 flex items-center justify-center text-[var(--primary)] font-bold">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="ml-2 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                                    title="Se déconnecter"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] focus:outline-none transition-colors"
                            >
                                <span className="sr-only">Open main menu</span>
                                {mobileMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-[var(--card)] border-t border-[var(--border)]">
                    <div className="pt-2 pb-3 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${isActive
                                        ? "bg-[var(--secondary)] border-[var(--primary)] text-[var(--primary)]"
                                        : "border-transparent text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <item.icon className="w-5 h-5 mr-3" />
                                        {item.label}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    <div className="pt-4 pb-4 border-t border-[var(--border)]">
                        <div className="flex items-center px-4">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-[var(--primary)] bg-opacity-20 flex items-center justify-center text-[var(--primary)] font-bold">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="ml-3">
                                <div className="text-base font-medium text-[var(--foreground)]">
                                    {user?.user_metadata?.full_name || "Utilisateur"}
                                </div>
                                <div className="text-sm font-medium text-[var(--muted-foreground)]">{user?.email}</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="ml-auto flex-shrink-0 p-1 rounded-full text-[var(--muted-foreground)] hover:text-red-500 focus:outline-none transition-colors"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
