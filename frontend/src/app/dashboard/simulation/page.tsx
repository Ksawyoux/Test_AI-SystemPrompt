"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useTracks } from "@livekit/components-react";
import "@livekit/components-styles";
import { getLiveKitToken, evaluateResponse, Question, EvaluationResponse, saveSessionAnalysis } from "@/lib/api";
import { getInterviewSession, InterviewSession, saveCompletedInterview, InterviewResponse, CompletedInterview, clearInterviewSession } from "@/lib/storage";
import AnimatedAvatar from "@/components/AnimatedAvatar";
import {
    Loader2, Mic, MicOff, Video, VideoOff, MessageSquare,
    Phone, MoreHorizontal, AlertCircle, ChevronUp, Circle, Smile,
    Volume2, X, Send, Users, PhoneOff, ArrowRight, Code
} from "lucide-react";
import dynamic from "next/dynamic";

const CodeEditorPanel = dynamic(() => import("@/components/dashboard/CodeEditorPanel"), {
    loading: () => <div className="w-full h-full bg-[#1e1e1e]" />,
    ssr: false
});
import { useRouter } from "next/navigation";
import { Track } from "livekit-client";

// Speech Recognition Types
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

// Audio Wave Animation Component
const AudioWave = ({ isActive, color = "bg-green-500" }: { isActive: boolean; color?: string }) => (
    <div className="flex items-center gap-0.5 h-4">
        {[1, 2, 3, 4].map((i) => (
            <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${color} ${isActive ? "animate-pulse" : ""
                    }`}
                style={{
                    height: isActive ? `${Math.random() * 12 + 4}px` : "4px",
                    animationDelay: `${i * 100}ms`,
                }}
            />
        ))}
    </div>
);

export default function SimulationPage() {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [currentIndex, setCurrentIndex] = useState(-1); // -1 = intro phase
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
    const [connectionState, setConnectionState] = useState("connecting");
    const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
    const [isIntroPhase, setIsIntroPhase] = useState(true); // Start with intro
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isAyaSpeaking, setIsAyaSpeaking] = useState(false);
    const [ayaStatus, setAyaStatus] = useState<string>("Ready");
    const [savedResponses, setSavedResponses] = useState<string[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'aya', text: string }>>([]);
    const [chatInput, setChatInput] = useState("");
    const [isTechnicalMode, setIsTechnicalMode] = useState(false);
    const [reactions, setReactions] = useState<Array<{ id: number, emoji: string, left: number }>>([]);
    const [code, setCode] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);
    const handleSubmitRef = useRef<() => Promise<void>>(async () => { }); // Ref to break cycle
    const startTimeRef = useRef<number>(Date.now());

    // Track interview responses for saving
    const [interviewResponses, setInterviewResponses] = useState<InterviewResponse[]>([]);

    // Lockdown mode state
    const [isLockdownActive, setIsLockdownActive] = useState(false);
    const [violations, setViolations] = useState(0);
    const [showViolationWarning, setShowViolationWarning] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const triggerReaction = (emoji: string) => {
        const id = Date.now();
        setReactions(prev => [...prev, { id, emoji, left: Math.random() * 80 + 10 }]);
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== id));
        }, 2000);
    };

    // Refs for speech recognition
    const silenceTimer = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef("");

    useEffect(() => {
        const storedSession = getInterviewSession();
        if (!storedSession) {
            router.push("/dashboard/new-simulation");
            return;
        }
        setSession(storedSession);

        // Save analysis to DB if connected
        if (storedSession.fitAnalysis) {
            saveSessionAnalysis(
                storedSession.sessionId,
                storedSession.fitAnalysis,
                storedSession.sessionName
            ).catch(err => console.error("Background save failed:", err));
        }

        if (storedSession.interviewType === 'technical') {
            setIsTechnicalMode(true);
        }

        const roomName = `interview-${storedSession.sessionId}`;
        getLiveKitToken(roomName, "Candidate")
            .then((t) => {
                setToken(t);
                setConnectionState("connected");
            })
            .catch((e) => {
                console.error(e);
                setConnectionState("error");
            });

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (silenceTimer.current) clearTimeout(silenceTimer.current);
        };
    }, [router]);

    // Lockdown mode: Request fullscreen and detect tab switches
    useEffect(() => {
        if (!session || connectionState !== "connected") return;

        // Request fullscreen on load
        const requestFullscreen = async () => {
            try {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
                setIsLockdownActive(true);
            } catch (e) {
                console.log("Fullscreen request denied");
            }
        };
        requestFullscreen();

        // Detect visibility change (tab switch)
        const handleVisibilityChange = () => {
            if (document.hidden && isLockdownActive) {
                setViolations(prev => prev + 1);
                setShowViolationWarning(true);
            }
        };

        // Detect fullscreen exit
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && isLockdownActive) {
                setIsFullscreen(false);
                setViolations(prev => prev + 1);
                setShowViolationWarning(true);
            } else if (document.fullscreenElement) {
                setIsFullscreen(true);
            }
        };

        // Prevent page leave
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isLockdownActive) {
                e.preventDefault();
                e.returnValue = 'Interview in progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [session, connectionState, isLockdownActive]);

    // Auto-hide violation warning after 5 seconds
    useEffect(() => {
        if (showViolationWarning) {
            const timer = setTimeout(() => setShowViolationWarning(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [showViolationWarning]);



    // Text-to-Speech function with feminine, human-like voice + D-ID avatar
    const speak = useCallback((text: string, onEnd?: () => void) => {
        if (!text || text.trim().length === 0) {
            if (onEnd) onEnd();
            return;
        }
        if (typeof window === "undefined" || !window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        setIsAyaSpeaking(true);
        setAyaStatus("Speaking");

        // Add natural pauses for more human-like speech
        const humanizedText = text
            .replace(/\. /g, '... ')  // Longer pause after sentences
            .replace(/\? /g, '?... ') // Pause after questions
            .replace(/, /g, ',, ');   // Slight pause at commas

        const utterance = new SpeechSynthesisUtterance(humanizedText);
        const browserLang = navigator.language || "en-US";
        const isEnglish = !browserLang.startsWith("fr");
        utterance.lang = isEnglish ? "en-US" : "fr-FR";
        utterance.rate = 0.9;   // Natural speaking pace
        utterance.pitch = 1.15; // Higher pitch for more feminine voice
        utterance.volume = 0.95; // Slightly softer for warmth

        // Priority list of premium female voices (most natural sounding)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoices = isEnglish
            ? ["samantha", "karen", "moira", "fiona", "victoria", "zira", "hazel", "susan", "female"]
            : ["amélie", "amelie", "marie", "virginie", "audrey", "female"];

        // Find the best matching female voice
        let selectedVoice = null;
        for (const preferred of preferredVoices) {
            selectedVoice = voices.find(v =>
                v.name.toLowerCase().includes(preferred) &&
                (isEnglish ? v.lang.startsWith("en") : v.lang.startsWith("fr"))
            );
            if (selectedVoice) break;
        }

        // Fallback: any female-sounding voice that's NOT male
        if (!selectedVoice) {
            selectedVoice = voices.find(v =>
                (isEnglish ? v.lang.startsWith("en") : v.lang.startsWith("fr")) &&
                !v.name.toLowerCase().includes("male") &&
                !v.name.toLowerCase().includes("daniel") &&
                !v.name.toLowerCase().includes("thomas") &&
                !v.name.toLowerCase().includes("david") &&
                !v.name.toLowerCase().includes("james") &&
                !v.name.toLowerCase().includes("alex")
            );
        }

        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.onend = () => {
            setIsAyaSpeaking(false);
            setAyaStatus("Ready");
            if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    const startListening = useCallback(() => {
        if (typeof window === "undefined") return;
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

        if (!SpeechRecognitionConstructor) {
            alert("Your browser doesn't support speech recognition. Please use Chrome or Edge.");
            return;
        }

        if (recognitionRef.current) recognitionRef.current.stop();

        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = true;
        recognition.interimResults = true;
        // Auto-detect language: use browser language, fallback to English
        const browserLang = navigator.language || "en-US";
        recognition.lang = browserLang.startsWith("fr") ? "fr-FR" : "en-US";

        recognition.onstart = () => {
            setIsRecording(true);
            setIsProcessing(false); // Safety reset
            setTranscript("");
            transcriptRef.current = "";
            setAyaStatus("Listening to you...");
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = "";
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const currentText = finalTranscript || interimTranscript;
            setTranscript(currentText);
            transcriptRef.current = currentText;

            // Reset silence timer
            if (silenceTimer.current) clearTimeout(silenceTimer.current);

            // Auto-submit after 3s of silence (more natural pause)
            silenceTimer.current = setTimeout(() => {
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }
            }, 3000);
        };

        recognition.onerror = (event: any) => {
            // Ignore common non-critical errors
            if (event.error === "aborted" || event.error === "no-speech") {
                setIsRecording(false);
                setAyaStatus("Ready");
                return;
            }
            console.warn("Speech recognition error:", event.error);
            setIsRecording(false);
            setAyaStatus("Ready");
        };

        recognition.onend = () => {
            setIsRecording(false);
            if (transcriptRef.current.trim().length > 2) {
                // Save the response
                setSavedResponses(prev => [...prev, transcriptRef.current]);
                handleSubmitRef.current();
            } else {
                setAyaStatus("Ready");
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [isMuted, isProcessing, isAyaSpeaking, session]);

    const handleSubmit = useCallback(async () => {
        if (isProcessing || !session) return;

        // Handle intro phase (self-introduction) - no evaluation needed
        if (isIntroPhase) {
            setIsIntroPhase(false);
            setCurrentIndex(0);
            setTranscript("");
            transcriptRef.current = "";
            // Speak transition and first question
            speak("Great, thank you for that introduction. Let's begin with the first question.", () => {
                setTimeout(() => {
                    if (session.questions[0]) {
                        // Auto-listen after question
                        speak(session.questions[0].question_text, () => startListening());
                    }
                }, 300);
            });
            return;
        }

        setIsProcessing(true);
        setAyaStatus("Processing your response...");

        // Safety timeout to prevent infinite processing state
        const safetyTimeout = setTimeout(() => {
            if (isProcessing) {
                setIsProcessing(false);
                setAyaStatus("Ready");
                console.warn("Forced processing reset due to timeout");
            }
        }, 30000); // 30s timeout

        const textToSubmit = transcriptRef.current;
        const question = session.questions[currentIndex];

        try {
            // Send for evaluation (stored in DB, not displayed)
            // Include code if in technical mode
            const codeToSubmit = isTechnicalMode && code.trim() ? code : undefined;
            const evaluation = await evaluateResponse(
                question, textToSubmit, session.sessionId, codeToSubmit, session.sessionName
            );
            clearTimeout(safetyTimeout);

            // Track this response for saving
            setInterviewResponses(prev => [...prev, {
                questionIndex: currentIndex,
                question: question.question_text,
                answer: textToSubmit,
                evaluation: evaluation,
                timestamp: Date.now()
            }]);

            // Move to next question or finish
            if (currentIndex < session.questions.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                setTranscript("");
                transcriptRef.current = "";

                // Speak dynamic transition and next question
                const transition = evaluation.conversational_response || "Okay, let's move on to the next question.";
                speak(transition, () => {
                    setTimeout(() => {
                        // Auto-listen after question
                        speak(session.questions[currentIndex + 1].question_text, () => startListening());
                    }, 300);
                });
            } else {
                // Last question - go to report
                speak("Thank you for completing the interview. I'm generating your detailed report now.", () => {
                    setTimeout(() => {
                        router.push(`/dashboard/report/${session.sessionId}`);
                    }, 1500);
                });
            }
        } catch (e) {
            console.error("Evaluation failed", e);
            clearTimeout(safetyTimeout);
            speak("I had trouble processing that. Let me move on to the next question.", () => {
                // Even on error, resume listening for next
                setTimeout(() => {
                    if (currentIndex < session.questions.length - 1) {
                        setCurrentIndex(prev => prev + 1);
                        speak(session.questions[currentIndex + 1].question_text, () => startListening());
                    }
                }, 500);
            });
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, session, isIntroPhase, currentIndex, speak, router]);

    // Sync handleSubmit to ref to break cycle
    useEffect(() => {
        handleSubmitRef.current = handleSubmit;
    }, [handleSubmit]);



    // Handle chat message submission
    const handleChatSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!chatInput.trim() || isProcessing || !session) return;

        const userMessage = chatInput.trim();
        setChatInput("");

        // Add user message to chat
        setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);

        // Scroll to bottom
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        // Process the message same as voice
        transcriptRef.current = userMessage;

        // Handle intro phase
        if (isIntroPhase) {
            setIsIntroPhase(false);
            setCurrentIndex(0);
            transcriptRef.current = "";
            const ayaResponse = "Great, thank you for that introduction. Let's begin with the first question.";
            setChatMessages(prev => [...prev, { role: 'aya', text: ayaResponse }]);
            speak(ayaResponse, () => {
                setTimeout(() => {
                    if (session.questions[0]) {
                        const q = session.questions[0].question_text;
                        setChatMessages(prev => [...prev, { role: 'aya', text: q }]);
                        speak(q, () => startListening()); // Auto-listen for chat flow too
                    }
                }, 300);
            });
            return;
        }

        setIsProcessing(true);
        setAyaStatus("Processing your response...");
        const question = session.questions[currentIndex];

        try {
            // Include code if in technical mode
            const codeToSubmit = isTechnicalMode && code.trim() ? code : undefined;
            const evaluation = await evaluateResponse(
                question, userMessage, session.sessionId, codeToSubmit, session.sessionName
            );

            if (currentIndex < session.questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                transcriptRef.current = "";
                const transition = evaluation.conversational_response || "Okay, let's move on to the next question.";
                setChatMessages(prev => [...prev, { role: 'aya', text: transition }]);
                speak(transition, () => {
                    setTimeout(() => {
                        const nextQ = session.questions[currentIndex + 1].question_text;
                        setChatMessages(prev => [...prev, { role: 'aya', text: nextQ }]);
                        speak(nextQ, () => startListening()); // Auto-listen
                    }, 300);
                });
            } else {
                const farewell = "Thank you for completing the interview. I'm generating your detailed report now.";
                setChatMessages(prev => [...prev, { role: 'aya', text: farewell }]);
                speak(farewell, () => {
                    setTimeout(() => router.push(`/dashboard/report/${session.sessionId}`), 1500);
                });
            }
        } catch (e) {
            console.error("Evaluation failed", e);
            const errorMsg = "I had trouble processing that. Let me move on to the next question.";
            setChatMessages(prev => [...prev, { role: 'aya', text: errorMsg }]);
            speak(errorMsg, () => {
                setTimeout(() => {
                    if (currentIndex < session.questions.length - 1) {
                        setCurrentIndex(prev => prev + 1);
                        speak(session.questions[currentIndex + 1].question_text, () => startListening());
                    }
                }, 500);
            });
        } finally {
            setIsProcessing(false);
        }
    };



    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            startListening();
        }
    };

    // Play Aya's introduction when session loads
    useEffect(() => {
        if (session && connectionState === "connected" && !hasPlayedIntro) {
            const browserLang = navigator.language || "en-US";
            const isEnglish = !browserLang.startsWith("fr");

            const introMessage = isEnglish
                ? "Hello! I'm Aya, and I'll be your interviewer today. When you're ready to answer, just click the microphone button. After you stop speaking for 5 seconds, I'll automatically process your response. Let's start with something easy - please introduce yourself."
                : "Bonjour ! Je suis Aya, et je serai votre intervieweuse aujourd'hui. Quand vous êtes prêt à répondre, cliquez simplement sur le bouton du microphone. Après 5 secondes de silence, je traiterai automatiquement votre réponse. Commençons par quelque chose de simple - présentez-vous s'il vous plaît.";

            // Wait for voices to load
            const speakIntro = () => {
                speak(introMessage, () => {
                    // Auto-start listening after intro
                    startListening();
                });
                setHasPlayedIntro(true);
            };

            if (window.speechSynthesis.getVoices().length > 0) {
                setTimeout(speakIntro, 1000);
            } else {
                window.speechSynthesis.onvoiceschanged = () => setTimeout(speakIntro, 500);
            }
        }
    }, [session, connectionState, hasPlayedIntro, speak]);

    // Speak question when moving to next (not for first question, handled by intro)
    useEffect(() => {
        if (session && currentIndex > 0 && session.questions[currentIndex] && !evaluation) {
            const timer = setTimeout(() => {
                speak(session.questions[currentIndex].question_text);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, session, evaluation, speak]);

    const handleNextQuestion = () => {
        if (!session) return;

        if (currentIndex < session.questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setEvaluation(null);
            setTranscript("");
            transcriptRef.current = "";
        } else {
            router.push(`/dashboard/report/${session.sessionId}`);
        }
    };

    // Toggle mute - controls recording
    const toggleMute = () => {
        if (!isMuted) {
            // Muting: stop listening
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsRecording(false);
            setIsMuted(true);
        } else {
            // Unmuting: start listening
            setIsMuted(false);
            startListening();
        }
    };

    // Loading State - Enhanced
    if (connectionState === "connecting") {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#0f0f13] via-[#1a1a2e] to-[#16213e]">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-purple-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-gray-400 text-lg">Connecting to interview room...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (connectionState === "error") {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900">
                <div className="text-center p-8 bg-gray-800 rounded-2xl">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
                    <p className="text-gray-400 mb-6">Unable to connect to the video server.</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = currentIndex >= 0 ? session.questions[currentIndex] : null;

    // Leave meeting handler - end interview and save results
    const handleLeave = () => {
        window.speechSynthesis.cancel();
        if (recognitionRef.current) recognitionRef.current.stop();

        // Exit fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }
        setIsLockdownActive(false);

        // Calculate overall score from evaluations
        const scores = interviewResponses
            .filter(r => r.evaluation?.score !== undefined)
            .map(r => r.evaluation!.score);
        const overallScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : undefined;

        // Save completed interview
        const completedInterview: CompletedInterview = {
            sessionId: session!.sessionId,
            sessionName: session!.sessionName || 'Interview Session',
            candidateName: session!.profile?.current_role || 'Candidate',
            candidateRole: session!.profile?.current_role,
            interviewType: session!.interviewType || 'technical',
            jobDescription: session!.jobDescription,
            fitAnalysis: session!.fitAnalysis,
            responses: interviewResponses,
            violations: violations,
            startedAt: startTimeRef.current,
            completedAt: Date.now(),
            overallScore
        };

        saveCompletedInterview(completedInterview);
        clearInterviewSession();

        // Redirect to campaigns page where results are shown
        router.push("/dashboard/campaigns");
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-[#0f0f13] via-[#12121a] to-[#0a0a0f] overflow-hidden">
            {/* Violation Warning Overlay */}
            {showViolationWarning && (
                <div className="fixed inset-0 z-[100] bg-red-900/90 flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-red-950 border-2 border-red-500 rounded-2xl p-8 max-w-md text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">⚠️ Warning</h2>
                        <p className="text-red-200 mb-4">
                            You left the interview window. This has been recorded.
                        </p>
                        <p className="text-red-300 text-sm mb-6">
                            Violations: <span className="font-bold text-red-400">{violations}</span>
                        </p>
                        <button
                            onClick={() => {
                                setShowViolationWarning(false);
                                document.documentElement.requestFullscreen().catch(() => { });
                            }}
                            className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors"
                        >
                            Return to Interview
                        </button>
                    </div>
                </div>
            )}

            {/* Top Header Strip - Glassmorphism */}
            <div className="h-14 bg-white/5 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                        <span className="text-white/90 text-sm font-medium">Live Interview</span>
                    </div>
                    <div className="h-4 w-px bg-white/20" />
                    <span className="text-white/50 text-sm">{session.sessionName || 'Interview Session'}</span>
                    {/* Violation counter */}
                    {violations > 0 && (
                        <>
                            <div className="h-4 w-px bg-white/20" />
                            <div className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium flex items-center gap-1">
                                <AlertCircle size={12} />
                                {violations} violation{violations > 1 ? 's' : ''}
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-sm font-medium">
                        Question {Math.max(currentIndex + 1, 1)} / {session.questions.length}
                    </div>
                </div>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 relative flex overflow-hidden">
                {/* Aya's Large Video Panel - Enhanced */}
                <div className={`relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f13] transition-all duration-300 ${isTechnicalMode ? "w-1/2 border-r border-white/10" : "flex-1"
                    }`}>
                    {/* Animated Avatar */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <AnimatedAvatar
                            isSpeaking={isAyaSpeaking}
                            avatarImage="/aya-avatar.png"
                            size={320}
                        />
                    </div>

                    {/* Speaker Name Overlay with Animation */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-3 z-10">
                        <div className={`px-4 py-2 rounded-lg flex items-center gap-3 ${isAyaSpeaking ? "bg-green-600" : "bg-black/70"
                            }`}>
                            {isAyaSpeaking && <AudioWave isActive={true} color="bg-white" />}
                            <span className="text-white text-sm font-medium">
                                Aya {isAyaSpeaking ? "- Speaking" : isRecording ? "- Listening" : ""}
                            </span>
                        </div>
                        {ayaStatus !== "Ready" && !isAyaSpeaking && (
                            <div className="bg-black/70 px-3 py-2 rounded-lg">
                                <span className="text-gray-300 text-sm">{ayaStatus}</span>
                            </div>
                        )}
                    </div>

                    {/* Question Subtitle (like Zoom captions) */}
                    {!isProcessing && (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 max-w-3xl w-full px-6">
                            <div className="bg-black/80 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
                                <p className="text-white text-lg leading-relaxed">
                                    {isIntroPhase
                                        ? "Please introduce yourself. Tell me about your background and experience."
                                        : currentQuestion?.question_text}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Processing indicator */}
                    {isProcessing && (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
                            <div className="bg-indigo-600 px-6 py-3 rounded-full flex items-center gap-3 text-white">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Processing your response...</span>
                            </div>
                        </div>
                    )}
                    {/* Self-View (Small Panel) */}
                    <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700 z-20">
                        <LiveKitRoom
                            video={!isCameraOff}
                            audio={!isMuted}
                            token={token}
                            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                            data-lk-theme="default"
                            style={{ height: "100%", width: "100%" }}
                        >
                            <div className="relative h-full w-full">
                                {isCameraOff ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                                        <VideoOff className="w-8 h-8 text-gray-400" />
                                    </div>
                                ) : (
                                    <LocalVideo />
                                )}
                            </div>
                            <RoomAudioRenderer />
                        </LiveKitRoom>

                        {/* Self Label */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-2">
                            <div className={`px-2 py-1 rounded flex items-center gap-2 ${isRecording ? "bg-green-600" : "bg-black/70"
                                }`}>
                                {isRecording && <AudioWave isActive={true} color="bg-white" />}
                                <span className="text-white text-xs">You{isRecording ? " - Speaking" : ""}</span>
                            </div>
                        </div>

                        {/* Mute indicator on self-view */}
                        {isMuted && (
                            <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1.5">
                                <MicOff size={12} className="text-white" />
                            </div>
                        )}
                    </div>

                    {/* Recording indicator */}
                    {isRecording && (
                        <div className="absolute top-4 left-4 z-20">
                            <div className="bg-red-500 px-4 py-2 rounded-lg flex items-center gap-3 text-white shadow-lg">
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                <span className="font-medium">Recording</span>
                                {transcript && (
                                    <span className="text-white/80 text-sm max-w-xs truncate">
                                        "{transcript.slice(0, 40)}..."
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Sidebar */}
                {isChatOpen && (
                    <div className="w-80 h-full bg-gray-900 border-l border-gray-700 flex flex-col transition-all duration-300">
                        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
                            <span className="font-medium text-white">Meeting Chat</span>
                            <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                                        }`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-1">
                                        {msg.role === 'user' ? 'You' : 'Aya'}
                                    </span>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-800">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-gray-800 text-white rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-700"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim() || isProcessing}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-400 disabled:opacity-50"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                    </div>

                )}

                {/* Technical Code Editor Area */}
                {isTechnicalMode && (
                    <div className="flex-1 bg-[#1e1e1e] border-l border-gray-700 overflow-hidden">
                        <CodeEditorPanel
                            onChange={(val) => setCode(val)}
                        />
                    </div>
                )}
            </div>

            {/* Zoom-Style Bottom Control Bar */}
            <div className="h-20 bg-[#1c1c1e] flex items-center justify-between px-4 shrink-0 border-t border-[#2d2d2d] z-50">
                {/* Left: Audio Control */}
                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center group cursor-pointer">
                        <button
                            onClick={toggleMute}
                            className={`flex flex-col items-center justify-center w-16 h-14 rounded-lg hover:bg-[#333333] transition-colors ${isMuted ? "text-red-500" : "text-gray-300"
                                }`}
                        >
                            {isMuted ? <MicOff size={22} /> : <Mic size={22} className={isRecording ? "animate-pulse text-green-500" : ""} />}
                            <span className="text-[11px] mt-1 font-medium">{isMuted ? "Unmute" : "Mute"}</span>
                        </button>
                    </div>
                </div>

                {/* Center: Meeting Controls */}
                <div className="flex items-center gap-1">
                    {/* Participants */}
                    <button className="flex flex-col items-center justify-center w-16 h-14 rounded-lg hover:bg-[#333333] transition-colors text-gray-300 relative group">
                        <div className="relative">
                            <Users size={22} />
                            <span className="absolute -top-1 -right-2 bg-gray-600 text-white text-[10px] px-1 rounded-sm">2</span>
                        </div>
                        <span className="text-[11px] mt-1 font-medium">Participants</span>
                    </button>

                    {/* Chat */}
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`flex flex-col items-center justify-center w-16 h-14 rounded-lg hover:bg-[#333333] transition-colors group ${isChatOpen ? "text-indigo-400 bg-[#333333]" : "text-gray-300"
                            }`}
                    >
                        <MessageSquare size={22} />
                        <span className="text-[11px] mt-1 font-medium">Chat</span>
                    </button>

                    {/* Code Mode Toggle */}
                    <button
                        onClick={() => setIsTechnicalMode(!isTechnicalMode)}
                        className={`flex flex-col items-center justify-center w-16 h-14 rounded-lg hover:bg-[#333333] transition-colors group ${isTechnicalMode ? "text-indigo-400 bg-[#333333]" : "text-gray-300"
                            }`}
                    >
                        <Code size={22} />
                        <span className="text-[11px] mt-1 font-medium">Code</span>
                    </button>

                    {/* Reactions */}
                    <div className="relative group">
                        <button
                            onClick={() => triggerReaction("👍")}
                            className="flex flex-col items-center justify-center w-16 h-14 rounded-lg hover:bg-[#333333] transition-colors text-gray-300"
                        >
                            <Smile size={22} />
                            <span className="text-[11px] mt-1 font-medium">Reactions</span>
                        </button>
                        {/* Hover Menu for more */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#2d2d2d] rounded-full p-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto shadow-xl border border-gray-700">
                            {["👏", "❤️", "😂", "😮"].map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={(e) => { e.stopPropagation(); triggerReaction(emoji); }}
                                    className="hover:scale-125 transition-transform text-xl"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* More */}
                    <button className="flex flex-col items-center justify-center w-16 h-14 rounded-lg hover:bg-[#333333] transition-colors text-gray-300">
                        <MoreHorizontal size={22} />
                        <span className="text-[11px] mt-1 font-medium">More</span>
                    </button>
                </div>

                {/* Right: End */}
                <div className="flex items-center">
                    <button
                        onClick={handleLeave}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                        End
                    </button>
                </div>
            </div>
        </div >
    );
}

// Local Video Component - renders just the video track
function LocalVideo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const tracks = useTracks([Track.Source.Camera]);

    useEffect(() => {
        const videoTrack = tracks.find(t => t.source === Track.Source.Camera);
        if (videoTrack?.publication?.track && videoRef.current) {
            videoTrack.publication.track.attach(videoRef.current);
        }
        return () => {
            if (videoTrack?.publication?.track && videoRef.current) {
                videoTrack.publication.track.detach(videoRef.current);
            }
        };
    }, [tracks]);

    return <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />;
}
