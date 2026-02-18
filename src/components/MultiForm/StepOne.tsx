"use client";

import { useCallback, useState } from "react";
import DropZone from "@/components/DropZone";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface StepOneProps {
    // You can add props here if needed
    setOutput: (val: string) => void;
    onNext: () => void;
}

export default function StepOne({
    setOutput,
    onNext,
}: StepOneProps) {
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
            setOutput(data.output || "");
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

    return (
        <div className="flex flex-col gap-4 items-center">
            <h2 className="text-2xl font-bold">Step 1: Scan Image</h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    {file && (
                        <span className="text-xs text-muted-foreground font-mono">
                            {file.name}
                        </span>
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
                        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm 
                  hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
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
            </div>
        </div>
    );
}