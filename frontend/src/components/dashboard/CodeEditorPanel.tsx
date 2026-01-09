"use client";

import { useState } from "react";

import dynamic from "next/dynamic";
import { Play, Terminal, Loader2 } from "lucide-react";

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
    const [isRunning, setIsRunning] = useState(false);
    const [activeLang, setActiveLang] = useState(language);

    const handleCodeChange = (value: string | undefined) => {
        const newCode = value || "";
        setCode(newCode);
        if (onChange) onChange(newCode);
    };

    const handleRun = () => {
        setIsRunning(true);
        setOutput("");

        // Mock execution delay
        setTimeout(() => {
            setIsRunning(false);
            let mockOutput = "";

            // Simple regex to extract print statements for "realism"
            if (activeLang === "python") {
                const match = code.match(/print\(['"](.+)['"]\)/);
                mockOutput = match ? `> ${match[1]}\n> Program exited with code 0` : "> Program executed successfully.\n> [No output captured]";
            } else if (activeLang === "javascript") {
                const match = code.match(/console\.log\(['"](.+)['"]\)/);
                mockOutput = match ? `> ${match[1]}\n> undefined` : "> Script executed.\n> undefined";
            } else {
                const match = code.match(/System\.out\.println\(['"](.+)['"]\)/);
                mockOutput = match ? `> ${match[1]}\n> Process finished with exit code 0` : "> Process finished with exit code 0";
            }
            setOutput(mockOutput);
        }, 1000);
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
                            setActiveLang(e.target.value);
                            setCode(
                                e.target.value === "python" ? "print('Hello, World!')" :
                                    e.target.value === "javascript" ? "console.log('Hello, World!');" :
                                        "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}"
                            );
                        }}
                        className="bg-[#3c3c3c] text-white text-xs px-2 py-1 rounded border border-[#2d2d2d] focus:outline-none focus:border-indigo-500"
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                    </select>
                </div>
                <button
                    onClick={handleRun}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${isRunning ? "bg-gray-600 text-gray-300 cursor-wait" : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                >
                    <Play size={14} className={isRunning ? "animate-pulse" : "fill-current"} />
                    {isRunning ? "Running..." : "Run Code"}
                </button>
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
                </div>
                <div className="flex-1 p-3 font-mono text-sm overflow-y-auto">
                    {output ? (
                        <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
                    ) : (
                        <span className="text-gray-500 italic">Click 'Run Code' to see output...</span>
                    )}
                </div>
            </div>
        </div>
    );
}
