"use client";

import Navbar from "@/components/Navbar";
import TiltCardGrid from "@/components/TiltCardGrid";
import Link from "next/link";
import { Sparkles, Shield, Code, CheckCircle, ArrowRight, Star } from "lucide-react";
import { motion, Variants } from "framer-motion";

// ===== SLEEK & PROFESSIONAL ANIMATION VARIANTS =====

// GlassRise: Elements fade in and slide up with backdrop blur feel
const glassRise: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }
  }
};

// SoftReveal: Gentle opacity fade with slight scale-up (0.95 → 1.0)
const softReveal: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// FocalEntry: Draws attention with a scale + glow effect
const focalEntry: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] } // Slight overshoot
  }
};

// GhostShift: Subtle, low-opacity transitions between sections
const ghostShift: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Staggered container for child animations
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

// Navbar slide down
const navSlide: Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }
  }
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* ===== ICON-BASED NAVIGATION ===== */}
      <motion.nav
        className="fixed top-0 left-0 w-full z-50 pt-4 px-4 md:px-8"
        variants={navSlide}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-full px-2 py-2 flex items-center gap-1 shadow-lg shadow-gray-200/30">
            {/* Icon Navigation Items */}
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
                href: "/",
                label: "Home"
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                href: "#features-detail",
                label: "Features"
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                href: "#how-it-works",
                label: "Help"
              },
            ].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="p-3 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
                title={item.label}
              >
                {item.icon}
              </Link>
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 mx-2" />

            {/* CTA Button */}
            <Link
              href="/signup"
              className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-4 overflow-hidden">
        {/* Glow Animation Behind Hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-indigo-400/30 via-purple-400/20 to-pink-400/30 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700 mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles className="w-3 h-3" />
            AI-Powered Interview Platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-4 leading-[1.1]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Test Yourself with
            <br />
            <span className="text-indigo-600">AI-Powered</span> Interviews
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Generate tailored interview questions, conduct live simulations, and get instant AI scoring — all in one powerful platform. Elevate your hiring process.
          </motion.p>

          {/* Email Input CTA */}
          <motion.div
            className="flex flex-col items-center gap-3 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <form
              className="flex items-center bg-gray-100 rounded-full p-1.5 w-full max-w-md shadow-sm border border-gray-200"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
                const email = emailInput?.value || '';
                window.location.href = `/signup?email=${encodeURIComponent(email)}`;
              }}
            >
              <input
                type="email"
                placeholder="Your email address"
                required
                className="flex-1 bg-transparent px-5 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all whitespace-nowrap"
              >
                Start Now
              </button>
            </form>

            {/* Social Proof */}
            <div className="flex items-center gap-3">
              {/* Avatar Stack */}
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Join <span className="font-semibold text-gray-900">+5,000</span> others on the platform
              </p>
            </div>
          </motion.div>

          {/* ===== DASHBOARD MOCKUP (Matching App Design) ===== */}
          <motion.div
            className="relative max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-pink-500/20 rounded-[32px] blur-2xl opacity-60"></div>
            <div className="relative bg-white border border-gray-200 rounded-[24px] shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white rounded-md px-4 py-1 text-xs text-gray-500 font-mono border border-gray-200">
                    app.agentic-interviewer.com
                  </div>
                </div>
              </div>

              {/* App Navbar */}
              <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-[10px] font-bold">N</div>
                    <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[9px] font-bold">AI</div>
                    <span className="font-semibold text-sm text-gray-800">Agentic Interviewer</span>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-full p-1">
                  <span className="px-4 py-1.5 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">Vue Générale</span>
                  <span className="px-4 py-1.5 text-xs font-medium text-gray-500">Mes Campagnes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-semibold text-gray-800">Youness Aboukad</p>
                    <p className="text-[10px] text-gray-400">kirra75art@protonmail.com</p>
                  </div>
                  <div className="w-8 h-8 bg-emerald-500 rounded-full"></div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 bg-gray-50/50">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Dashboard</h3>
                    <p className="text-xs text-gray-500">Track your progress and get personalized AI recommendations.</p>
                  </div>
                  <button className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-gray-800 transition-all">
                    <span className="text-lg font-bold">+</span> New Simulation
                  </button>
                </div>

                {/* Main Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Performance Trends Card - 2 columns */}
                  <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-gray-900">Performance Trends</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-md">Last 7 Days ▾</span>
                    </div>
                    {/* Line Chart Mockup */}
                    <div className="h-36 relative">
                      {/* Y-Axis Labels */}
                      <div className="absolute left-0 top-0 bottom-4 flex flex-col justify-between text-[9px] text-gray-400 w-6">
                        <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                      </div>
                      {/* Chart Area */}
                      <div className="ml-8 h-full border-l border-b border-gray-200 relative">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                          {[...Array(5)].map((_, i) => <div key={i} className="border-t border-dashed border-gray-100 w-full" />)}
                        </div>
                        {/* Line */}
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <polyline fill="none" stroke="#6366f1" strokeWidth="2" points="5,80 20,75 35,78 50,70 65,72 80,68 95,65" />
                          {/* Data Points */}
                          {[[5, 80], [20, 75], [35, 78], [50, 70], [65, 72], [80, 68], [95, 65]].map(([x, y], i) => (
                            <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" />
                          ))}
                        </svg>
                        {/* X-Axis Labels */}
                        <div className="absolute -bottom-4 left-0 right-0 flex justify-between text-[9px] text-gray-400 px-2">
                          <span>Fri</span><span>Fri</span><span>Fri</span><span>Fri</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendations Card */}
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4" />
                      <h4 className="font-semibold text-sm">AI Recommendations</h4>
                    </div>
                    <div className="space-y-3">
                      {[
                        { title: "Technical Depth", desc: "Focus on: The candidate needs to provide a detailed explanation..." },
                        { title: "Communication Style", desc: "Your communication is clear. Ensure you maintain this structure." },
                        { title: "Speaking Pace", desc: "Maintain a steady 130-150 wpm pace. Pause for emphasis..." },
                      ].map((rec, i) => (
                        <div key={i} className="bg-white/10 rounded-lg px-3 py-2">
                          <p className="text-xs font-semibold">{rec.title}</p>
                          <p className="text-[10px] text-white/70 leading-snug">{rec.desc.substring(0, 60)}...</p>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-4 bg-white text-indigo-700 rounded-lg py-2 text-xs font-semibold">
                      View Personalized Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURE CARDS SECTION ===== */}
      <section id="features-detail" className="py-20 md:py-32 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            variants={glassRise}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <p className="text-sm font-semibold text-indigo-600 mb-3">FEATURES</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Everything You Need to Ace Interviews</h2>
            <p className="text-lg text-gray-600">Powerful tools designed to help you prepare and succeed</p>
          </motion.div>

          {/* Feature Cards Grid - Stagger Container */}
          <motion.div
            className="grid md:grid-cols-2 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Card 1 - Resume Analysis - SoftReveal */}
            <motion.div
              className="group bg-white border border-gray-200 rounded-[24px] overflow-hidden hover:shadow-xl transition-all duration-300"
              variants={softReveal}
            >
              {/* Image Area */}
              <div className="h-48 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-40 bg-white rounded-xl shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                    <div className="p-3 space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                      <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-2 bg-amber-400 rounded w-1/2 mt-4"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                    Resume Analysis
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Resume Scanning, Powered by AI</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">Upload your resume and get instant analysis. Our AI identifies your strengths, weaknesses, and generates tailored interview questions based on your experience.</p>
                <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all group">
                  Learn More
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Card 2 - Live Interview - SoftReveal */}
            <motion.div
              className="group bg-white border border-gray-200 rounded-[24px] overflow-hidden hover:shadow-xl transition-all duration-300"
              variants={softReveal}
            >
              {/* Content First for this card */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                    Live Interview
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Practice with Real-Time AI Simulation</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">Experience realistic interview simulations with voice-enabled Q&A. Get instant transcription and feedback as you answer each question.</p>
                <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all group">
                  Learn More
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              {/* Image Area */}
              <div className="h-48 bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-100 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 bg-purple-300 rounded w-20"></div>
                      <div className="h-1.5 bg-purple-400 rounded w-16"></div>
                      <div className="h-1.5 bg-purple-300 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 3 - AI Scoring (Full Width) - FocalEntry */}
            <motion.div
              className="md:col-span-2 group bg-white border border-gray-200 rounded-[24px] overflow-hidden hover:shadow-xl transition-all duration-300"
              variants={focalEntry}
            >
              <div className="grid md:grid-cols-2 gap-0">
                {/* Content */}
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                      AI Scoring
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Instant Feedback & Detailed Reports</h3>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">Get comprehensive evaluation reports with AI-powered scoring. Understand your strengths, areas for improvement, and receive actionable recommendations to boost your interview performance.</p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {["Detailed Scoring", "Personalized Tips", "Progress Tracking", "Export Reports"].map((feature, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        {feature}
                      </span>
                    ))}
                  </div>
                  <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all group w-fit">
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                {/* Image Area */}
                <div className="h-64 md:h-auto bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl p-4 transform group-hover:scale-105 transition-transform">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-gray-500">Interview Score</span>
                        <span className="text-xs text-emerald-500 font-bold">+12%</span>
                      </div>
                      <div className="text-4xl font-bold text-gray-900 mb-2">87<span className="text-lg text-gray-400">/100</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: "Technical Skills", score: 92 },
                          { label: "Communication", score: 85 },
                          { label: "Problem Solving", score: 78 },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{item.label}</span>
                            <span className="font-semibold text-gray-900">{item.score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 md:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col items-center text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm mb-6">
              <span className="text-sm font-medium text-gray-900">How it works</span>
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-600 text-lg max-w-xl">A smooth 3-step process to ace your next interview</p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: 1,
                title: "Upload your resume",
                description: "Submit your resume and job description. Our AI will analyze both to understand your profile.",
                icon: (
                  <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
              {
                step: 2,
                title: "AI generates questions",
                description: "Get personalized interview questions tailored to your experience and the role requirements.",
                icon: (
                  <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                step: 3,
                title: "Practice & improve",
                description: "Answer questions, receive instant AI feedback, and track your progress over time.",
                icon: (
                  <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                {/* Icon Container */}
                <div className="relative mb-6">
                  {/* Dashed orbit circle */}
                  <div
                    className="absolute inset-0 w-20 h-20 rounded-full border border-dashed border-amber-400/40"
                    style={{
                      transform: `rotate(${index * 45}deg)`,
                      animation: 'spin 20s linear infinite'
                    }}
                  />
                  {/* Icon circle */}
                  <div className="relative w-20 h-20 bg-gray-50 border border-white shadow-lg rounded-full flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xs">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-px border-t border-dashed border-amber-300/50 pointer-events-none" />
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 md:py-24 px-4 bg-indigo-600 rounded-t-[40px] md:rounded-t-[60px]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to transform your hiring?
          </h2>
          <p className="text-lg text-indigo-100 mb-10">Join thousands of companies already using Agentic Interviewer.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-10 py-4 rounded-full text-base font-semibold hover:bg-indigo-50 transition-all shadow-xl">
            Start Your Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ===== FOOTER (4-COLUMN) ===== */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {["About", "Careers", "Press", "Contact"].map((item) => (
                <li key={item}><Link href="#" className="hover:text-white transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {["Features", "How it works", "Integrations", "Changelog"].map((item) => (
                <li key={item}><Link href="#" className="hover:text-white transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {["Blog", "Documentation", "Help Center", "Community"].map((item) => (
                <li key={item}><Link href="#" className="hover:text-white transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Social</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {["Twitter", "LinkedIn", "GitHub", "Discord"].map((item) => (
                <li key={item}><Link href="#" className="hover:text-white transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">AI</div>
            <span className="font-semibold">Agentic Interviewer</span>
          </div>
          <p className="text-sm text-gray-500">© 2025 Agentic Interviewer. All rights reserved.</p>
        </div>
      </footer>
    </main >
  );
}
