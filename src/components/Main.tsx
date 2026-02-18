"use client";
import { useSession, signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import DropZone from "./DropZone";
import { FileSearch, FileText, Loader2, Trash2, Mail, Edit, ScanLine, Database, ArrowRight } from "lucide-react";
import { useToast } from "./ToastProvider";
import JsonDisplay from "./JsonDisplay";
import Link from "next/link";
import EditDrawer, { EditableItem } from "./EditDrawer";

export default function Main() {
    const { data: session, status } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<Record<string, unknown> | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { toast } = useToast();
    const [history, setHistory] = useState<EditableItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [editItem, setEditItem] = useState<EditableItem | null>(null);

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch("/api/save-scanned-data");
            const data = await res.json();
            if (data.success) setHistory(data.data);
        } catch {
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            fetchHistory();
        }
    }, [status, fetchHistory]);

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
            const resp = await fetch(`/api/analyze-document`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || `Error ${resp.status}`);
            }

            const data = await resp.json();
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

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this record?")) return;
        setActionLoading((s) => ({ ...s, [id]: true }));
        try {
            const resp = await fetch(`/api/save-scanned-data`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!resp.ok) throw new Error("Failed to delete");
            setHistory((h) => h.filter((it) => it._id !== id));
            toast({ title: "Deleted", description: "Record removed." });
        } catch (e) {
            toast({ title: "Delete failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
        } finally {
            setActionLoading((s) => ({ ...s, [id]: false }));
        }
    };

    const handleEditSaved = useCallback(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSendEmail = async (id: string) => {
        setActionLoading((s) => ({ ...s, [id]: true }));
        try {
            const resp = await fetch(`/api/save-scanned-data/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || "Failed to send email");
            }
            toast({ title: "Email sent", description: "Record sent to your email." });
        } catch (e) {
            toast({ title: "Send failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
        } finally {
            setActionLoading((s) => ({ ...s, [id]: false }));
        }
    };

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                        <FileSearch className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading…
                    </div>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">

                        {/* Top accent */}
                        <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-400" />

                        <div className="p-8">
                            {/* Brand */}
                            <div className="flex items-center gap-3 mb-7">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                                    <FileSearch className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">DocScan AI</p>
                                    <span className="text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                        Powered by AI + OCR
                                    </span>
                                </div>
                            </div>

                            {/* Headline */}
                            <div className="mb-7">
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white leading-snug mb-2">
                                    Scan documents.<br />Extract data instantly.
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    Upload any document and let AI pull out structured data in seconds — names, dates, financials, and more.
                                </p>
                            </div>

                            {/* Features */}
                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                        <ScanLine className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">OCR + AI Extraction</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Reads IDs, invoices, receipts, contracts, and more with high accuracy.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                                        <Database className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Structured & Saved</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Every scan is stored to your account — searchable, editable, always there.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                                        <Mail className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Share via Email</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Send extracted data directly to any email address in one click.</p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <Link
                                href="/signin"
                                className="w-full py-3 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                Get Started — Sign In
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <p className="text-center text-[11px] text-zinc-400 mt-3">Free to use · No credit card required</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">

            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-14 px-6 flex items-center justify-between
                bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 z-20">

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-blue-600/10 flex items-center justify-center">
                        <FileSearch className="w-4 h-4 text-blue-600" />
                    </div>
                    <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
                        DocScan <span className="text-blue-600">AI</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate max-w-[160px]">
                        {session.user?.name || session.user?.email}
                    </span>
                    <button
                        onClick={() => signOut()}
                        className="px-3 py-1.5 text-xs rounded-md bg-zinc-900 text-white
                            hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="pt-20 px-6 pb-10 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Input */}
                    <section className="bg-white dark:bg-zinc-900 border border-zinc-200
                        dark:border-zinc-800 rounded-lg shadow-sm p-6 flex flex-col gap-5">

                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
                                <FileSearch className="w-4 h-4 text-blue-500" />
                                Input
                            </h2>
                            {file && (
                                <span className="text-xs text-zinc-500 truncate max-w-[160px]" title={file.name}>
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
                                className="w-full py-2.5 text-sm rounded-md bg-blue-600 text-white
                                    hover:bg-blue-700 transition flex items-center justify-center gap-2
                                    disabled:opacity-50 disabled:cursor-not-allowed"
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

                    {/* Output */}
                    <section className="bg-white dark:bg-zinc-900 border border-zinc-200
                        dark:border-zinc-800 rounded-lg shadow-sm p-6 flex flex-col gap-5">

                        <h2 className="text-sm font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-500" />
                            Output
                        </h2>

                        {result ? (
                            <JsonDisplay data={result} onSaved={fetchHistory} />
                        ) : (
                            <div className="border border-dashed border-zinc-300 dark:border-zinc-700
                                rounded-md p-8 text-center text-sm text-zinc-500">
                                {isAnalyzing
                                    ? "Processing document…"
                                    : "Upload and analyze to see results"}
                            </div>
                        )}
                    </section>

                    {/* History */}
                    <section className="lg:col-span-2 bg-white dark:bg-zinc-900
                        border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm p-6">

                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-zinc-800 dark:text-white">
                                History
                            </h2>
                            {history.length > 0 && (
                                <span className="text-xs text-zinc-400">
                                    {history.length} record{history.length !== 1 ? "s" : ""}
                                </span>
                            )}
                        </div>

                        {loadingHistory ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading…
                            </div>
                        ) : history.length === 0 ? (
                            <div className="border border-dashed border-zinc-300
                                dark:border-zinc-700 rounded-md p-8 text-center text-sm text-zinc-500">
                                No scanned documents yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-xs uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="pb-3 pr-4">Last</th>
                                            <th className="pb-3 pr-4">First</th>
                                            <th className="pb-3 pr-4">Middle</th>
                                            <th className="pb-3 pr-4">Gender</th>
                                            <th className="pb-3 pr-4">Birthdate</th>
                                            <th className="pb-3 pr-4">Address</th>
                                            <th className="pb-3 pr-4">Date</th>
                                            <th className="pb-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((item) => (
                                            <tr
                                                key={item._id}
                                                className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                                                <td className="py-3 pr-4 text-xs text-zinc-700 dark:text-zinc-300">{item.entities?.lastName || "—"}</td>
                                                <td className="py-3 pr-4 text-xs text-zinc-700 dark:text-zinc-300">{item.entities?.firstName || "—"}</td>
                                                <td className="py-3 pr-4 text-xs text-zinc-700 dark:text-zinc-300">{item.entities?.middleName || "—"}</td>
                                                <td className="py-3 pr-4 text-xs text-zinc-700 dark:text-zinc-300">{item.entities?.gender || "—"}</td>
                                                <td className="py-3 pr-4 text-xs text-zinc-700 dark:text-zinc-300">{item.entities?.birthdate || "—"}</td>
                                                <td className="py-3 pr-4 text-xs text-zinc-700 dark:text-zinc-300 max-w-[160px] truncate" title={item.entities?.address}>
                                                    {item.entities?.address || "—"}
                                                </td>
                                                <td className="py-3 pr-4 text-xs text-zinc-400 whitespace-nowrap">
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            onClick={() => setEditItem(item)}
                                                            className="p-1.5 rounded-md text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendEmail(item._id)}
                                                            className="p-1.5 rounded-md text-zinc-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title={item.entities?.emails?.length ? "Send email" : "No email on record"}
                                                            disabled={!!actionLoading[item._id] || !item.entities?.emails?.length}
                                                        >
                                                            {actionLoading[item._id]
                                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                : <Mail className="w-4 h-4" />
                                                            }
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item._id)}
                                                            className="p-1.5 rounded-md text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title="Delete"
                                                            disabled={!!actionLoading[item._id]}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <EditDrawer
                item={editItem}
                onClose={() => setEditItem(null)}
                onSaved={handleEditSaved}
            />
        </div>
    );
}
