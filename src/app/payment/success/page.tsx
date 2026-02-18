"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, FileSearch, ArrowRight, Loader2 } from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter — 30 scans/month",
  pro: "Pro — Unlimited scans",
};

function SuccessContent() {
  const params = useSearchParams();
  const plan = params.get("plan") ?? "";
  const label = PLAN_LABELS[plan] ?? "your new plan";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl
        border border-zinc-200 dark:border-zinc-800 overflow-hidden">

        <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-emerald-400" />

        <div className="p-8 flex flex-col items-center text-center gap-5">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20
            flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600/10 flex items-center justify-center">
              <FileSearch className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              DocScan AI
            </span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
              Payment successful!
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You&apos;re now on <span className="font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>.
              Your scan count has been reset and your new limit is active.
            </p>
          </div>

          {/* Note */}
          <div className="w-full rounded-lg bg-blue-50 dark:bg-blue-900/20 border
            border-blue-100 dark:border-blue-800 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
            If your plan does not appear immediately, wait a few seconds and
            refresh the dashboard — activation is handled automatically.
          </div>

          {/* CTA */}
          <Link
            href="/"
            className="w-full py-3 text-sm font-medium bg-blue-600 text-white rounded-xl
              hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
