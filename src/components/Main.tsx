"use client";
import { useSession, signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DropZone from "./DropZone";
import {
    FileSearch, FileText, Loader2, Trash2, Mail, Edit,
    ScanLine, Database, ArrowRight, Zap, Crown, X, CheckCircle2, Facebook, Linkedin,
} from "lucide-react";

import { useToast } from "./ToastProvider";
import JsonDisplay from "./JsonDisplay";
import Link from "next/link";
import EditDrawer, { EditableItem } from "./EditDrawer";

// ── Subscription types ────────────────────────────────────────────────────────

interface SubscriptionInfo {
    plan: "trial" | "starter" | "pro";
    planName: string;
    scansUsed: number;
    scansLimit: number;
    isUnlimited: boolean;
    pricePhp: number;
}

const PLAN_FEATURES: Record<string, { icon: React.ReactNode; color: string; features: string[]; pricePhp: number; scanLabel: string }> = {
    trial: {
        icon: <ScanLine className="w-4 h-4" />,
        color: "text-zinc-500",
        pricePhp: 0,
        scanLabel: "3 lifetime scans",
        features: ["3 scans (lifetime)", "Full AI extraction", "Save & export"],
    },
    starter: {
        icon: <Zap className="w-4 h-4" />,
        color: "text-blue-500",
        pricePhp: 499,
        scanLabel: "30 scans / month",
        features: ["30 scans / month", "Full AI extraction", "Save & export", "Email sharing"],
    },
    pro: {
        icon: <Crown className="w-4 h-4" />,
        color: "text-amber-500",
        pricePhp: 1499,
        scanLabel: "Unlimited scans",
        features: ["Unlimited scans", "Full AI extraction", "Save & export", "Email sharing", "Priority support"],
    },
};

// ── History helpers ───────────────────────────────────────────────────────────

const IDENTITY_TYPES = new Set(["id", "passport", "drivers_license"]);
const KNOWN_TYPED = new Set(["invoice", "receipt", "business_card", "contract", "medical", "form"]);

const TYPE_BADGE_COLORS: Record<string, string> = {
    id: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    passport: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    drivers_license: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    invoice: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    receipt: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    business_card: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
    contract: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    medical: "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
    form: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function TypeBadge({ type }: { type: string }) {
    const color = TYPE_BADGE_COLORS[type] ?? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize whitespace-nowrap ${color}`}>
            {type.replace(/_/g, " ")}
        </span>
    );
}

function formatCurrency(amount: number | null | undefined, currency?: string | null): string {
    if (amount == null) return "—";
    const n = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currency ? `${currency} ${n}` : n;
}

function getKeyIdentifier(item: EditableItem): string {
    const t = (item.documentType || "other").toLowerCase();
    if (IDENTITY_TYPES.has(t)) {
        return [item.idInfo?.firstName, item.idInfo?.lastName].filter(Boolean).join(" ")
            || item.entities?.firstName || item.idInfo?.idNumber || "—";
    }
    if (t === "invoice") {
        return item.invoiceDetails?.invoiceNumber || item.financialData?.invoiceNumber || item.vendor?.name || "—";
    }
    if (t === "receipt") {
        return item.merchant?.name || item.receiptDetails?.receiptNumber || item.financialData?.receiptNumber || "—";
    }
    if (t === "business_card") {
        return [item.contact?.firstName, item.contact?.lastName].filter(Boolean).join(" ")
            || item.contact?.company || "—";
    }
    if (t === "contract") {
        return item.contractInfo?.title
            || (item.parties ?? []).map((p) => p.name).filter(Boolean).join(", ") || "—";
    }
    if (t === "medical") {
        return [item.patient?.firstName, item.patient?.lastName].filter(Boolean).join(" ")
            || item.provider?.name || "—";
    }
    if (t === "form") return item.formTitle || item.formNumber || "—";
    return (item.rawText || "").slice(0, 40) || "—";
}

type HistoryColumn = {
    key: string;
    header: string;
    render: (item: EditableItem) => React.ReactNode;
    truncate?: boolean;
};

const COLUMNS_ALL: HistoryColumn[] = [
    { key: "type", header: "Type", render: (i) => <TypeBadge type={i.documentType || "other"} /> },
    { key: "id", header: "Identifier", render: (i) => getKeyIdentifier(i), truncate: true },
    { key: "scanned", header: "Scanned", render: (i) => new Date(i.createdAt).toLocaleString() },
];

const COLUMNS_IDENTITY: HistoryColumn[] = [
    { key: "idType", header: "ID Type", render: (i) => i.idInfo?.idType || i.documentType || "—" },
    { key: "idNum", header: "ID #", render: (i) => i.idInfo?.idNumber || "—" },
    { key: "first", header: "First", render: (i) => i.idInfo?.firstName || i.entities?.firstName || "—" },
    { key: "last", header: "Last", render: (i) => i.idInfo?.lastName || i.entities?.lastName || "—" },
    { key: "dob", header: "Birthdate", render: (i) => i.idInfo?.birthdate || i.entities?.birthdate || "—" },
    { key: "expiry", header: "Expiry", render: (i) => i.idInfo?.expirationDate || "—" },
    { key: "scanned", header: "Scanned", render: (i) => new Date(i.createdAt).toLocaleString() },
];

const COLUMNS_INVOICE: HistoryColumn[] = [
    { key: "num", header: "Invoice #", render: (i) => i.invoiceDetails?.invoiceNumber || i.financialData?.invoiceNumber || "—" },
    { key: "vendor", header: "Vendor", render: (i) => i.vendor?.name || "—", truncate: true },
    { key: "client", header: "Client", render: (i) => i.client?.name || "—", truncate: true },
    { key: "total", header: "Total", render: (i) => formatCurrency(i.invoiceDetails?.total ?? i.financialData?.total, i.invoiceDetails?.currency || i.financialData?.currency) },
    { key: "due", header: "Due Date", render: (i) => i.invoiceDetails?.dueDate || i.financialData?.dueDate || "—" },
    { key: "scanned", header: "Scanned", render: (i) => new Date(i.createdAt).toLocaleString() },
];

const COLUMNS_RECEIPT: HistoryColumn[] = [
    { key: "num", header: "Receipt #", render: (i) => i.receiptDetails?.receiptNumber || i.financialData?.receiptNumber || "—" },
    { key: "merchant", header: "Merchant", render: (i) => i.merchant?.name || "—", truncate: true },
    { key: "total", header: "Total", render: (i) => formatCurrency(i.receiptDetails?.total ?? i.financialData?.total, i.receiptDetails?.currency || i.financialData?.currency) },
    { key: "payment", header: "Payment", render: (i) => i.receiptDetails?.paymentMethod || "—" },
    { key: "date", header: "Date", render: (i) => i.receiptDetails?.date || i.financialData?.date || "—" },
    { key: "scanned", header: "Scanned", render: (i) => new Date(i.createdAt).toLocaleString() },
];

const COLUMNS_BUSINESS_CARD: HistoryColumn[] = [
    { key: "name", header: "Name", render: (i) => [i.contact?.firstName, i.contact?.lastName].filter(Boolean).join(" ") || "—" },
    { key: "title", header: "Title", render: (i) => i.contact?.title || "—" },
    { key: "company", header: "Company", render: (i) => i.contact?.company || "—", truncate: true },
    { key: "email", header: "Email", render: (i) => i.contact?.email || "—", truncate: true },
    { key: "phone", header: "Phone", render: (i) => i.contact?.phone || i.contact?.mobilePhone || "—" },
    { key: "scanned", header: "Scanned", render: (i) => new Date(i.createdAt).toLocaleString() },
];

const COLUMNS_CONTRACT: HistoryColumn[] = [
    { key: "title", header: "Title", render: (i) => i.contractInfo?.title || "—", truncate: true },
    { key: "parties", header: "Parties", render: (i) => (i.parties ?? []).map((p) => p.name).filter(Boolean).join(", ") || "—", truncate: true },
    { key: "effective", header: "Effective", render: (i) => i.contractInfo?.effectiveDate || "—" },
    { key: "expiry", header: "Expiry", render: (i) => i.contractInfo?.expirationDate || "—" },
    { key: "scanned", header: "Scanned", render: (i) => new Date(i.createdAt).toLocaleString() },
];

const COLUMNS_MEDICAL: HistoryColumn[] = [
    { key: "patient", header: "Patient", render: (i) => [i.patient?.firstName, i.patient?.lastName].filter(Boolean).join(" ") || "—" },
    { key: "provider", header: "Provider", render: (i) => i.provider?.name || "—", truncate: true },
    { key: "date", header: "Date", render: (i) => i.documentDate || "—" },
    { key: "diagnosis", header: "Diagnosis", render: (i) => (i.diagnosis ?? []).join(", ") || "—", truncate: true },
    { key: "scanned", header: "Scanned", render: (i) => new Date(i.createdAt).toLocaleString() },
];

const COLUMNS_FORM: HistoryColumn[] = [
    { key: "title", header: "Form Title", render: (i) => i.formTitle || "—", truncate: true },
    { key: "num", header: "Form #", render: (i) => i.formNumber || "—" },
    { key: "date", header: "Date", render: (i) => i.date || "—" },
    { key: "scanned", header: "Scanned", render: (i) => new Date(i.createdAt).toLocaleString() },
];

const COLUMNS_OTHER: HistoryColumn[] = [
    { key: "type", header: "Type", render: (i) => <TypeBadge type={i.documentType || "other"} /> },
    { key: "preview", header: "Preview", render: (i) => (i.rawText || "").slice(0, 60) + ((i.rawText || "").length > 60 ? "…" : "") || "—", truncate: true },
    { key: "scanned", header: "Scanned", render: (i) => new Date(i.createdAt).toLocaleString() },
];

function getColumns(tab: string): HistoryColumn[] {
    switch (tab) {
        case "identity": return COLUMNS_IDENTITY;
        case "invoice": return COLUMNS_INVOICE;
        case "receipt": return COLUMNS_RECEIPT;
        case "business_card": return COLUMNS_BUSINESS_CARD;
        case "contract": return COLUMNS_CONTRACT;
        case "medical": return COLUMNS_MEDICAL;
        case "form": return COLUMNS_FORM;
        case "other": return COLUMNS_OTHER;
        default: return COLUMNS_ALL;
    }
}

const TAB_DEFS = [
    { key: "all", label: "All" },
    { key: "identity", label: "Identity", types: IDENTITY_TYPES },
    { key: "invoice", label: "Invoices", types: new Set(["invoice"]) },
    { key: "receipt", label: "Receipts", types: new Set(["receipt"]) },
    { key: "business_card", label: "Business Cards", types: new Set(["business_card"]) },
    { key: "contract", label: "Contracts", types: new Set(["contract"]) },
    { key: "medical", label: "Medical", types: new Set(["medical"]) },
    { key: "form", label: "Forms", types: new Set(["form"]) },
    { key: "other", label: "Other", types: null },
] as const;

function getItemTabKey(documentType: string | undefined): string {
    const t = (documentType || "other").toLowerCase();
    if (IDENTITY_TYPES.has(t)) return "identity";
    if (KNOWN_TYPED.has(t)) return t;
    return "other";
}

// ── Main component ────────────────────────────────────────────────────────────

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
    const [activeTab, setActiveTab] = useState("all");

    // ── Tab / filter memos ────────────────────────────────────────────────────

    const tabCounts = useMemo(() => {
        const counts: Record<string, number> = { all: history.length };
        for (const item of history) {
            const key = getItemTabKey(item.documentType);
            counts[key] = (counts[key] ?? 0) + 1;
        }
        return counts;
    }, [history]);

    const visibleTabs = useMemo(
        () => TAB_DEFS.filter((t) => t.key === "all" || (tabCounts[t.key] ?? 0) > 0)
            .map((t) => ({ ...t, count: tabCounts[t.key] ?? 0 })),
        [tabCounts]
    );

    const filteredHistory = useMemo(() => {
        if (activeTab === "all") return history;
        return history.filter((item) => getItemTabKey(item.documentType) === activeTab);
    }, [history, activeTab]);

    const columns = useMemo(() => getColumns(activeTab), [activeTab]);

    // Subscription state
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [upgrading, setUpgrading] = useState<string | null>(null); // plan key being upgraded

    // ── Data fetchers ─────────────────────────────────────────────────────────

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

    const fetchSubscription = useCallback(async () => {
        try {
            const res = await fetch("/api/subscription");
            if (res.ok) setSubscription(await res.json());
        } catch {
            // non-critical — fail silently
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            fetchHistory();
            fetchSubscription();
        }
    }, [status, fetchHistory, fetchSubscription]);

    // ── File handlers ─────────────────────────────────────────────────────────

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

    // ── Analyze ───────────────────────────────────────────────────────────────

    const handleAnalyze = async () => {
        if (!file || !preview) return;
        setIsAnalyzing(true);
        setResult(null);

        try {
            const base64 = preview.split(",")[1];
            const resp = await fetch("/api/analyze-document", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
            });

            if (resp.status === 403) {
                // Scan limit reached — show upgrade modal instead of generic error
                setShowUpgrade(true);
                return;
            }

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error((err as { error?: string }).error || `Error ${resp.status}`);
            }

            const data = await resp.json();
            setResult(data);

            // Optimistically update local scan counter
            setSubscription((s) =>
                s ? { ...s, scansUsed: s.scansUsed + 1 } : s
            );
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

    // ── Upgrade plan — creates a PayMongo checkout session then redirects ─────

    const handleUpgrade = async (plan: "starter" | "pro") => {
        setUpgrading(plan);
        try {
            const resp = await fetch("/api/subscription/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error((err as { error?: string }).error || "Could not start checkout");
            }
            const { url } = await resp.json() as { url: string };
            // Redirect to PayMongo hosted checkout page
            window.location.href = url;
        } catch (e) {
            toast({
                title: "Checkout failed",
                description: e instanceof Error ? e.message : "Unknown error",
                variant: "destructive",
            });
            setUpgrading(null);
        }
        // Note: don't clear `upgrading` on success — the page is navigating away
    };

    // ── History actions ───────────────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this record?")) return;
        setActionLoading((s) => ({ ...s, [id]: true }));
        try {
            const resp = await fetch("/api/save-scanned-data", {
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
            const resp = await fetch("/api/save-scanned-data/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error((err as { error?: string }).error || "Failed to send email");
            }
            toast({ title: "Email sent", description: "Record sent to your email." });
        } catch (e) {
            toast({ title: "Send failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
        } finally {
            setActionLoading((s) => ({ ...s, [id]: false }));
        }
    };

    // ── Derived subscription UI values ────────────────────────────────────────

    const usagePct = subscription && !subscription.isUnlimited
        ? Math.min(100, Math.round((subscription.scansUsed / subscription.scansLimit) * 100))
        : 0;
    const atLimit = subscription
        ? !subscription.isUnlimited && subscription.scansUsed >= subscription.scansLimit
        : false;

    // ── Loading / unauthenticated screens ─────────────────────────────────────

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
                            <p className="text-center text-[11px] text-zinc-400 mt-3">
                                Start free · 3 scans included · No credit card required
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Authenticated app ─────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">

            {/* ── Header ─────────────────────────────────────────────────── */}
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
                    {/* Plan badge */}
                    {subscription && (
                        <button
                            onClick={() => setShowUpgrade(true)}
                            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition
                                ${subscription.plan === "pro"
                                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40"
                                    : subscription.plan === "starter"
                                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40"
                                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                                }`}
                        >
                            {subscription.plan === "pro" && <Crown className="w-3 h-3" />}
                            {subscription.plan === "starter" && <Zap className="w-3 h-3" />}
                            {subscription.planName}
                            {!subscription.isUnlimited && (
                                <span className="opacity-70">
                                    · {subscription.scansUsed}/{subscription.scansLimit}
                                </span>
                            )}
                        </button>
                    )}
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate max-w-[140px]">
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

            {/* ── Main content ────────────────────────────────────────────── */}
            <main className="pt-20 px-6 pb-10 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Input panel */}
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
                            <div className="flex flex-col gap-2">
                                {atLimit ? (
                                    /* Limit-reached state */
                                    <div className="rounded-md border border-amber-200 dark:border-amber-800
                                        bg-amber-50 dark:bg-amber-900/20 p-3 flex items-start gap-3">
                                        <Crown className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                                                {subscription?.plan === "trial"
                                                    ? "Free trial scans used up"
                                                    : "Monthly scan limit reached"}
                                            </p>
                                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                                {subscription?.plan === "trial"
                                                    ? "Upgrade to keep scanning — plans start at $9/mo."
                                                    : "Your limit resets next billing cycle."}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowUpgrade(true)}
                                            className="shrink-0 px-3 py-1.5 text-xs rounded-md bg-amber-500
                                                text-white hover:bg-amber-600 transition font-medium"
                                        >
                                            Upgrade
                                        </button>
                                    </div>
                                ) : (
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

                                {/* Usage meter */}
                                {subscription && !subscription.isUnlimited && (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] text-zinc-400">
                                                {subscription.scansUsed} / {subscription.scansLimit} scans used
                                                {subscription.plan === "trial" && " (lifetime)"}
                                                {subscription.plan !== "trial" && " this month"}
                                            </span>
                                            {subscription.plan === "trial" && !atLimit && (
                                                <button
                                                    onClick={() => setShowUpgrade(true)}
                                                    className="text-[11px] text-blue-500 hover:text-blue-600 transition"
                                                >
                                                    Upgrade
                                                </button>
                                            )}
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300
                                                    ${usagePct >= 100 ? "bg-red-500" : usagePct >= 66 ? "bg-amber-400" : "bg-blue-500"}`}
                                                style={{ width: `${usagePct}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {subscription?.isUnlimited && (
                                    <p className="text-[11px] text-center text-amber-500 font-medium">
                                        ∞ Unlimited scans · Pro plan
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Output panel */}
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

                        {/* Type filter tabs */}
                        {!loadingHistory && history.length > 0 && (
                            <div className="flex gap-1 mb-4 overflow-x-auto pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                {visibleTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition
                                            ${activeTab === tab.key
                                                ? "bg-blue-600 text-white"
                                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            }`}
                                    >
                                        {tab.label}
                                        {tab.key !== "all" && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                                                ${activeTab === tab.key
                                                    ? "bg-white/20 text-white"
                                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                                }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {loadingHistory ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading…
                            </div>
                        ) : filteredHistory.length === 0 ? (
                            <div className="border border-dashed border-zinc-300
                                dark:border-zinc-700 rounded-md p-8 text-center text-sm text-zinc-500">
                                {history.length === 0
                                    ? "No scanned documents yet."
                                    : `No ${activeTab === "all" ? "" : activeTab.replace(/_/g, " ") + " "}documents found.`}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-xs uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            {columns.map((col) => (
                                                <th key={col.key} className="pb-3 pr-4 whitespace-nowrap">{col.header}</th>
                                            ))}
                                            <th className="pb-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.map((item) => (
                                            <tr
                                                key={item._id}
                                                className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                                                {columns.map((col) => (
                                                    <td
                                                        key={col.key}
                                                        className={`py-3 pr-4 text-xs text-zinc-700 dark:text-zinc-300 ${col.truncate ? "max-w-[140px] truncate" : "whitespace-nowrap"}`}
                                                    >
                                                        {col.render(item)}
                                                    </td>
                                                ))}
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
                                                            title="Send email"
                                                            disabled={!!actionLoading[item._id]}
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

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer className="text-center text-xs text-zinc-400 py-6">
                <div>&copy; {new Date().getFullYear()} DocScan AI. All rights reserved.</div>
                <div className="mt-2">Powered by <a href="#" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">DevCom Digital Marketing Services</a></div>
                <div className="mt-2 flex items-center justify-center gap-4">
                    <a href="https://www.facebook.com/DevComDMS" aria-label="DevCom on Facebook" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-blue-600">
                        <Facebook className="w-4 h-4" />
                        <span className="text-xs">Facebook</span>
                    </a>
                    <a href="https://www.linkedin.com/company/devcom-digital-marketing-services" aria-label="DevCom on LinkedIn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-blue-700">
                        <Linkedin className="w-4 h-4" />
                        <span className="text-xs">LinkedIn</span>
                    </a>
                </div>
            </footer>
            
            <EditDrawer
                item={editItem}
                onClose={() => setEditItem(null)}
                onSaved={handleEditSaved}
            />

            {/* ── Upgrade modal ────────────────────────────────────────────── */}
            {showUpgrade && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4
                        bg-black/40 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowUpgrade(false); }}
                >
                    <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl
                        border border-zinc-200 dark:border-zinc-800 overflow-hidden">

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    Choose your plan
                                </h3>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Upgrade to unlock more scans. Cancel anytime.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowUpgrade(false)}
                                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600
                                    hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Pricing cards */}
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {(["trial", "starter", "pro"] as const).map((planKey) => {
                                const meta = PLAN_FEATURES[planKey];
                                const isCurrent = subscription?.plan === planKey;
                                const isProPlan = planKey === "pro";
                                const isLoading = upgrading === planKey;

                                return (
                                    <div
                                        key={planKey}
                                        className={`relative rounded-xl border p-4 flex flex-col gap-3 transition
                                            ${isCurrent
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                                                : isProPlan
                                                    ? "border-amber-300 dark:border-amber-700"
                                                    : "border-zinc-200 dark:border-zinc-700"
                                            }`}
                                    >
                                        {isProPlan && (
                                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2
                                                text-[10px] font-bold px-2 py-0.5 rounded-full
                                                bg-amber-400 text-white whitespace-nowrap">
                                                Most Popular
                                            </span>
                                        )}

                                        <div className={`flex items-center gap-2 ${meta.color}`}>
                                            {meta.icon}
                                            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                                                {planKey === "trial" ? "Free Trial" : planKey === "starter" ? "Starter" : "Pro"}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                                                {meta.pricePhp === 0 ? "Free" : `₱${meta.pricePhp.toLocaleString()}`}
                                            </span>
                                            {meta.pricePhp > 0 && (
                                                <span className="text-xs text-zinc-400"> / mo</span>
                                            )}
                                            <p className="text-xs text-zinc-500 mt-0.5">{meta.scanLabel}</p>
                                        </div>

                                        <ul className="flex flex-col gap-1.5 flex-1">
                                            {meta.features.map((f) => (
                                                <li key={f} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>

                                        {isCurrent ? (
                                            <div className="w-full py-2 text-xs text-center font-medium
                                                text-blue-600 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                Current plan
                                            </div>
                                        ) : planKey !== "trial" ? (
                                            <button
                                                onClick={() => handleUpgrade(planKey)}
                                                disabled={!!upgrading}
                                                className={`w-full py-2 text-xs font-medium rounded-lg transition
                                                    flex items-center justify-center gap-1.5
                                                    disabled:opacity-50 disabled:cursor-not-allowed
                                                    ${isProPlan
                                                        ? "bg-amber-500 text-white hover:bg-amber-600"
                                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                                    }`}
                                            >
                                                {isLoading ? (
                                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Upgrading…</>
                                                ) : (
                                                    `Upgrade to ${planKey === "starter" ? "Starter" : "Pro"}`
                                                )}
                                            </button>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>

                        <p className="px-6 pb-4 text-center text-[11px] text-zinc-400">
                            Secure checkout via PayMongo · GCash, Maya, Card accepted · Scan count resets on upgrade
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
