"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Play, Terminal, Loader2, Clock } from "lucide-react";
import { executeCode } from "@/lib/api";

const Editor = dynamic(() => import("@monaco-editor/react"), {
    loading: () => <div className="flex items-center justify-center h-full text-gray-500"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading Editor...</div>,
    ssr: false
});

interface CodeEditorPanelProps {
    language?: string;
    onChange?: (code: string) => void;
}

export default function CodeEditorPanel({ language = "python", onChange }: CodeEditorPanelProps) {
    const [code, setCode] = useState<string>(
        language === "python" ? "print('Hello, World!')" :
            language === "javascript" ? "console.log('Hello, World!');" :
                "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}"
    );
    const [output, setOutput] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isRunning, setIsRunning] = useState(false);
    const [activeLang, setActiveLang] = useState(language);
    const [executionTime, setExecutionTime] = useState<number | null>(null);

    const handleCodeChange = (value: string | undefined) => {
        const newCode = value || "";
        setCode(newCode);
        if (onChange) onChange(newCode);
    };

    const handleRun = async () => {
        setIsRunning(true);
        setOutput("");
        setError("");
        setExecutionTime(null);

        try {
            const result = await executeCode(code, activeLang);

            if (result.success) {
                setOutput(result.output || "> Program executed successfully (no output)");
                setError("");
            } else {
                setOutput(result.output || "");
                setError(result.error || "Execution failed");
            }

            setExecutionTime(result.execution_time);
        } catch (err: any) {
            setError(err.message || "Failed to execute code");
            setOutput("");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-[#2d2d2d]">
            {/* Toolbar */}
            <div className="h-12 bg-[#252526] flex items-center justify-between px-4 shrink-0 border-b border-[#2d2d2d]">
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm font-medium">Editor Mode</span>
                    <select
                        value={activeLang}
                        onChange={(e) => {
                            const newLang = e.target.value;
                            setActiveLang(newLang);
                            setCode(
                                newLang === "python" ? "print('Hello, World!')" :
                                    newLang === "javascript" ? "console.log('Hello, World!');" :
                                        "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}"
                            );
                            setOutput("");
                            setError("");
                        }}
                        className="bg-[#3c3c3c] text-white text-xs px-2 py-1 rounded border border-[#2d2d2d] focus:outline-none focus:border-indigo-500"
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    {executionTime !== null && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <Clock size={12} />
                            <span>{executionTime}s</span>
                        </div>
                    )}
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${isRunning ? "bg-gray-600 text-gray-300 cursor-wait" : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                    >
                        {isRunning ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Play size={14} className="fill-current" />
                        )}
                        {isRunning ? "Running..." : "Run Code"}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 min-h-0 relative">
                <Editor
                    height="100%"
                    language={activeLang}
                    value={code}
                    theme="vs-dark"
                    onChange={handleCodeChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                    }}
                />
            </div>

            {/* Console Output */}
            <div className="h-40 bg-[#1e1e1e] border-t border-[#2d2d2d] flex flex-col shrink-0">
                <div className="h-8 bg-[#252526] px-4 flex items-center gap-2 border-b border-[#2d2d2d]">
                    <Terminal size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-300 font-medium">Console Output</span>
                    {isRunning && <Loader2 size={12} className="text-yellow-400 animate-spin ml-2" />}
                </div>
                <div className="flex-1 p-3 font-mono text-sm overflow-y-auto">
                    {isRunning ? (
                        <span className="text-yellow-400">Executing code...</span>
                    ) : output || error ? (
                        <>
                            {output && <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>}
                            {error && <pre className="text-red-400 whitespace-pre-wrap mt-2">{error}</pre>}
                        </>
                    ) : (
                        <span className="text-gray-500 italic">Click 'Run Code' to see output...</span>
                    )}
                </div>
            </div>
        </div>
    );
}
