"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2, Save, Lock, User as UserIcon, Mail } from "lucide-react";

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile Form State
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");

    // Password Form State
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setFullName(user.user_metadata?.full_name || "");
                setEmail(user.email || "");
            }
            setLoading(false);
        };
        getUser();
    }, [supabase]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);

        try {
            const updates: { data?: { full_name: string }; email?: string } = {};
            if (fullName !== user?.user_metadata?.full_name) {
                updates.data = { full_name: fullName };
            }
            if (email !== user?.email) {
                updates.email = email;
            }

            if (Object.keys(updates).length === 0) {
                setUpdating(false);
                return;
            }

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            // Also update the 'profiles' table for application-level persistence
            if (user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        full_name: fullName,
                        email: email,
                        updated_at: new Date().toISOString(),
                    });

                if (profileError) {
                    console.error('Error updating public profile:', profileError);
                }
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            if (updates.email) {
                setMessage({ type: 'success', text: 'Profile updated! Check your new email for a confirmation link.' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: "Passwords do not match." });
            setUpdating(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-background/50">
            <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-8 animate-in fade-in duration-500">

                {/* Header Section */}
                <div className="space-y-4 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Account Settings
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Manage your personal details and security preferences in one place.
                    </p>
                </div>

                {message && (
                    <div className={`mx-auto max-w-full mb-8 p-4 rounded-xl text-sm font-medium border shadow-sm ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/20'
                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Simplified Card: Profile */}
                    <div className="bg-card border border-border shadow-sm rounded-xl p-6 transition-all hover:shadow-md">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                <UserIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Profile Information</h2>
                                <p className="text-sm text-muted-foreground">Update your public profile details.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80" htmlFor="name">
                                    Display Name
                                </label>
                                <div className="relative">
                                    <input
                                        id="name"
                                        className="w-full bg-background border border-input rounded-lg px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Your Name"
                                    />
                                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        type="email"
                                        className="w-full bg-background border border-input rounded-lg px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="email@example.com"
                                    />
                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/50" />
                                </div>
                                <p className="text-[11px] text-muted-foreground ml-1">
                                    Verification required for email changes.
                                </p>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg py-2.5 text-sm font-medium shadow-sm transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 flex justify-center items-center"
                                >
                                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Simplified Card: Security */}
                    <div className="bg-card border border-border shadow-sm rounded-xl p-6 transition-all hover:shadow-md">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <Lock className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Security</h2>
                                <p className="text-sm text-muted-foreground">Manage your password and access.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80" htmlFor="new-password">
                                    New Password
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80" htmlFor="confirm-password">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="pt-4 mt-auto">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-input rounded-lg py-2.5 text-sm font-medium shadow-sm transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 flex justify-center items-center"
                                >
                                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
