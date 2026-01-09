import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Agentic Interviewer | AI-Powered Interview Questions",
  description: "Accelerate your hiring with AI-generated interview questions. Upload resumes, generate tailored questions, and conduct live interviews with instant AI scoring.",
  keywords: ["interview", "AI", "hiring", "recruitment", "HR", "questions"],
};

import { ThemeProvider } from "@/components/ThemeProvider";

// ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
