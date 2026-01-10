"use client";

import Navbar from "@/components/Navbar";
import TiltCardGrid from "@/components/TiltCardGrid";
import Link from "next/link";
import { Sparkles, Shield, Code, CheckCircle, ArrowRight, Star } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* ===== GLASSMORPHISM NAVIGATION ===== */}
      <nav className="fixed top-0 left-0 w-full z-50 pt-4 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-full px-6 py-3 flex items-center justify-between shadow-lg shadow-gray-200/20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                AI
              </div>
              <span className="hidden sm:inline">Agentic Interviewer</span>
            </Link>

            {/* Links */}
            <div className="hidden md:flex items-center gap-8">
              {[{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }, { label: "Blog", href: "#blog" }].map((item) => (
                <Link key={item.label} href={item.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>

            {/* CTA */}
            <Link href="/login" className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-4 overflow-hidden">
        {/* Glow Animation Behind Hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-indigo-400/30 via-purple-400/20 to-pink-400/30 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700 mb-8">
            <Sparkles className="w-3 h-3" />
            AI-Powered Interview Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
            Test Yourself with
            <br />
            <span className="text-indigo-600">AI-Powered</span> Interviews
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Generate tailored interview questions, conduct live simulations, and get instant AI scoring — all in one powerful platform. Elevate your hiring process.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login" className="bg-indigo-600 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-indigo-700 transition-all shadow-xl hover:shadow-2xl flex items-center gap-2 group">
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#product" className="bg-gray-100 text-gray-700 px-8 py-4 rounded-full text-base font-semibold hover:bg-gray-200 transition-all">
              See How It Works
            </Link>
          </div>

          {/* ===== DASHBOARD MOCKUP (Matching App Design) ===== */}
          <div className="relative max-w-5xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* ===== LOGO CLOUD ===== */}
      <section className="py-16 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-400 mb-8 uppercase tracking-wider">Trusted by industry leaders</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-40 grayscale">
            {["Acme Inc", "TechCorp", "Innovate", "StartupX", "GlobalFirm"].map((name, i) => (
              <div key={i} className="text-2xl font-bold text-gray-400">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURE TILT CARDS ===== */}
      <section id="features" className="py-20 md:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 mb-3">WHY CHOOSE US</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Why Choose Agentic Interviewer</h2>
          </div>

          {/* 3D Tilt Card Grid */}
          <TiltCardGrid
            cards={[
              {
                icon: <Sparkles className="w-7 h-7 text-indigo-600" />,
                title: "AI-Powered Scanning",
                description: "Automatically analyze resumes and generate tailored interview questions based on job requirements and candidate experience.",
                bgColor: "white",
                iconBgColor: "bg-indigo-100"
              },
              {
                icon: <Shield className="w-7 h-7 text-purple-600" />,
                title: "AI Interview Simulation",
                description: "Test yourself by answering questions for both technical and behavioral interviews. Get real-time feedback and scoring.",
                bgColor: "white",
                iconBgColor: "bg-purple-100"
              },
              {
                icon: <Code className="w-7 h-7 text-amber-600" />,
                title: "Coding Assessment",
                description: "See if your skills at code are as loud as you speak. Practice with real coding challenges and get instant feedback.",
                bgColor: "white",
                iconBgColor: "bg-amber-100"
              },
            ]}
          />
        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section id="pricing" className="py-20 md:py-32 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 mb-3">PRICING</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600">Choose the plan that fits your hiring needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "29", desc: "Perfect for small teams", features: ["50 interviews/month", "Basic analytics", "Email support", "1 team member"] },
              { name: "Pro", price: "99", desc: "For growing companies", features: ["500 interviews/month", "Advanced analytics", "Priority support", "10 team members", "Custom branding"], popular: true },
              { name: "Enterprise", price: "299", desc: "For large organizations", features: ["Unlimited interviews", "Full analytics suite", "24/7 phone support", "Unlimited members", "SSO & API access", "Dedicated manager"] },
            ].map((plan, i) => (
              <div key={i} className={`relative bg-white border rounded-[24px] p-8 ${plan.popular ? 'border-indigo-500 shadow-xl' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-indigo-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className={`block text-center py-3 rounded-full font-semibold transition-all ${plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 md:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 mb-3">TESTIMONIALS</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Sweet words from our users</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sarah Chen", role: "Head of HR, TechFlow", quote: "Agentic Interviewer cut our hiring time by 60%. The AI-generated questions are incredibly relevant and insightful." },
              { name: "Marcus Johnson", role: "CEO, StartupX", quote: "We've interviewed 500+ candidates using this platform. The consistency and quality of insights is unmatched." },
              { name: "Emily Rodriguez", role: "Talent Lead, Innovate", quote: "Finally, a tool that understands what we need. The automated scoring saves us hours every week." },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-[24px] p-8 hover:shadow-lg transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
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
    </main>
  );
}
