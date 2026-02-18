"use client";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useCallback, useState } from "react";
import DropZone from "./DropZone";
import { FileSearch, Loader2 } from "lucide-react";
import { useToast } from "./ToastProvider";
import JsonDisplay from "./JsonDisplay";

export default function Main() {
    const { data: session, status } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<Record<string, unknown> | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { toast } = useToast();

    const handleFileSelect = useCallback((f: File) => {
        setFile(f);
        setResult(null);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(f);
    }, []);

    const handleClear = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
    };

    const handleAnalyze = async () => {
        if (!file || !preview) return;
        setIsAnalyzing(true);
        setResult(null);

        try {
            const base64 = preview.split(",")[1];
            const resp = await fetch(`/api/analyze-document`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
                }
            );

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || `Error ${resp.status}`);
            }

            const data = await resp.json();
            console.log("Analysis result:", data);
            setResult(data);
        } catch (e) {
            toast({
                title: "Analysis failed",
                description: e instanceof Error ? e.message : "Unknown error",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (status === "loading") {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }
    if (!session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 flex flex-col items-center">
                    <h2 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50">Welcome to Smart Scanner</h2>
                    <p className="mb-6 text-zinc-600 dark:text-zinc-300">Sign in to access your dashboard and features.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 to-zinc-100 dark:from-zinc-900 dark:to-black font-sans">
            <header className="w-full px-2 sm:px-6 py-3 flex items-center justify-between bg-white/90 dark:bg-zinc-900/90 shadow-sm fixed top-0 left-0 z-20 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FileSearch className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="leading-tight">
                        <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">DocScan <span className="text-blue-600 dark:text-blue-400">AI</span></h1>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Extract structured data from any document image</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {session.user?.image ? (
                        <Image
                            src={session.user.image}
                            alt="User avatar"
                            width={36}
                            height={36}
                            className="rounded-full border border-blue-400 dark:border-blue-500 shadow-sm object-cover"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-base font-bold text-blue-700 dark:text-blue-200">
                            {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                        </div>
                    )}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm max-w-[120px] truncate">{session.user?.name || session.user?.email || "User"}</span>
                    <button
                        onClick={() => signOut()}
                        className="px-3 py-1 rounded-full bg-red-600 text-white font-semibold shadow-sm hover:bg-red-700 transition-colors text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                        title="Sign out"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-2 sm:px-6 py-8 sm:py-12 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Card */}
                    <section className="bg-white/90 dark:bg-zinc-900/90 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-6 min-h-[350px]">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                                <FileSearch className="w-4 h-4 text-blue-500" />
                                Input
                            </h2>
                            {file && (
                                <span className="text-xs text-zinc-500 font-mono truncate max-w-[120px]">{file.name}</span>
                            )}
                        </div>
                        <DropZone
                            onFileSelect={handleFileSelect}
                            preview={preview}
                            onClear={handleClear}
                            isAnalyzing={isAnalyzing}
                        />
                        {file && (
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ boxShadow: isAnalyzing ? "none" : "var(--glow-primary)" }}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Analyzing…
                                    </>
                                ) : (
                                    "Analyze Document"
                                )}
                            </button>
                        )}
                    </section>
                    {/* Output Card */}
                    <section className="bg-white/90 dark:bg-zinc-900/90 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-6 min-h-[350px]">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                                <FileSearch className="w-4 h-4 text-green-500" />
                                Output
                            </h2>
                        </div>
                        {result ? (
                            <JsonDisplay data={result} />
                        ) : (
                            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-10 flex flex-col items-center justify-center gap-3 bg-zinc-50/60 dark:bg-zinc-800/40">
                                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                    <FileSearch className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                                </div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                                    {isAnalyzing
                                        ? "Processing document…"
                                        : "Upload an image and click analyze to see results"}
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}  
