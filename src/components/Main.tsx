"use client";
import { useSession, signOut, signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import DropZone from "./DropZone";
import { FileSearch, Loader2, Trash2, Edit, Mail } from "lucide-react";
import { useToast } from "./ToastProvider";
import JsonDisplay from "./JsonDisplay";
import Link from "next/link";

export default function Main() {
    const { data: session, status } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<Record<string, unknown> | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { toast } = useToast();
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (status === "authenticated") {
            setLoadingHistory(true);
            fetch("/api/save-scanned-data")
                .then(res => res.json())
                .then(data => {
                    if (data.success) setHistory(data.data);
                })
                .catch(() => setHistory([]))
                .finally(() => setLoadingHistory(false));
        }
    }, [status]);

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

    const handleEdit = (item: any) => {
        // load item into Output for quick edit/view
        setResult(item);
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast({ title: "Loaded", description: "Record loaded into Output for editing." });
    };

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
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }
    if (!session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
                <div className="bg-white dark:bg-zinc-900 shadow-lg p-8 flex flex-col items-center gap-4 w-full max-w-md">
                    <h2 className="text-2xl font-semibold mb-0 text-black dark:text-zinc-50">Welcome to Smart Scanner</h2>
                    <p className="text-sm mb-4 text-zinc-600 dark:text-zinc-300">Sign in to access your dashboard and features.</p>
                            <div className="w-full flex gap-3">
                                <Link
                                    href="/signin"
                                    className="flex-1 py-2.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2 text-center"
                                >
                                    Sign In
                                </Link>
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
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate max-w-[120px]">
                        {session.user?.name || session.user?.email}
                    </span>
                    <button
                        onClick={() => signOut()}
                        className="px-3 py-1.5 text-xs rounded-md bg-zinc-900 text-white 
          hover:bg-zinc-700 transition"
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
                                <span className="text-xs text-zinc-500 truncate max-w-[120px]">
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
              disabled:opacity-50"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Analyzing
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
                            <FileSearch className="w-4 h-4 text-green-500" />
                            Output
                        </h2>

                        {result ? (
                            <JsonDisplay data={result} />
                        ) : (
                            <div className="border border-dashed border-zinc-300 dark:border-zinc-700 
              rounded-md p-8 text-center text-sm text-zinc-500">
                                {isAnalyzing
                                    ? "Processing document..."
                                    : "Upload and analyze to see results"}
                            </div>
                        )}
                    </section>

                    {/* History */}
                    <section className="lg:col-span-2 bg-white dark:bg-zinc-900 
          border border-zinc-200 dark:border-zinc-800 rounded-lg 
          shadow-sm p-6">

                        <h2 className="text-sm font-semibold text-zinc-800 dark:text-white mb-4">
                            History
                        </h2>

                        {loadingHistory ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading...
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
                                            <th className="py-3">Date</th>
                                            <th>User</th>
                                            <th>Last</th>
                                            <th>First</th>
                                            <th>Middle</th>
                                            <th>Gender</th>
                                            <th>Birthdate</th>
                                            <th>Address</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((item) => (
                                            <tr
                                                key={item._id}
                                                className="border-b border-zinc-100 dark:border-zinc-800 
                      hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                                            >
                                                <td className="py-3 text-xs text-zinc-500">
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </td>
                                                <td className="truncate max-w-[120px]">
                                                    {item.user}
                                                </td>
                                                <td>{item.entities?.lastName}</td>
                                                <td>{item.entities?.firstName}</td>
                                                <td>{item.entities?.middleName}</td>
                                                <td>{item.entities?.gender}</td>
                                                <td>{item.entities?.birthdate}</td>
                                                <td>{item.entities?.address}</td>
                                                <td className="py-3 text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        {/* <button
                                                            onClick={() => handleEdit(item)}
                                                            className="text-zinc-600 hover:text-blue-600 p-1"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button> */}

                                                        <button
                                                            onClick={() => handleSendEmail(item._id)}
                                                            className="text-zinc-600 hover:text-green-600 p-1"
                                                            title="Send email"
                                                            disabled={!!actionLoading[item._id]}
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDelete(item._id)}
                                                            className="text-zinc-600 hover:text-red-600 p-1"
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
        </div>
    );

}  
