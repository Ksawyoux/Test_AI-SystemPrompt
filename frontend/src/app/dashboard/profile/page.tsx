"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { User as UserIcon, Mail, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setFullName(user.user_metadata?.full_name || "");
                setEmail(user.email || "");
            }
        };
        getUser();
    }, [supabase]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const updates: { email?: string, data?: { full_name: string } } = {};

            if (fullName !== user?.user_metadata?.full_name) {
                updates.data = { full_name: fullName };
            }

            if (email !== user?.email) {
                updates.email = email;
            }

            if (Object.keys(updates).length === 0) {
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            setMessage({
                type: 'success',
                text: updates.email
                    ? "Profile updated! Please check your new email for a confirmation link."
                    : "Profile updated successfully!"
            });

            // Refresh user data
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            if (updatedUser) setUser(updatedUser);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "An error occurred" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
                        <p className="text-gray-500">Manage your account information</p>
                    </div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold mb-4">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-lg text-gray-900">{fullName || "User"}</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active Agent
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <UserIcon size={16} />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Enter your name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Mail size={16} />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Enter your email"
                            />
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <AlertCircle size={12} />
                                Changing email will require verification.
                            </p>
                        </div>

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                    }`}
                            >
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <p className="text-sm font-medium">{message.text}</p>
                            </motion.div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
