"use client";
import Link from "next/link";
import { XCircle, FileSearch, ArrowLeft } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl
        border border-zinc-200 dark:border-zinc-800 overflow-hidden">

        <div className="h-1 bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300" />

        <div className="p-8 flex flex-col items-center text-center gap-5">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800
            flex items-center justify-center">
            <XCircle className="w-8 h-8 text-zinc-400" />
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
              Payment cancelled
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No charge was made. You can upgrade whenever you&apos;re ready —
              your current plan and scan history are untouched.
            </p>
          </div>

          {/* CTA */}
          <Link
            href="/"
            className="w-full py-3 text-sm font-medium bg-zinc-900 text-white rounded-xl
              hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 active:scale-[0.98]
              transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
