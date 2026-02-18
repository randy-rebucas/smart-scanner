"use client";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function Main() {
  const { data: session, status } = useSession();

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-zinc-100 dark:from-zinc-900 dark:to-black font-sans">
      <main className="flex min-h-screen w-full max-w-2xl flex-col items-center justify-center py-20 px-8 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl">
        <div className="flex flex-col items-center gap-4 mb-8">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt="User avatar"
              width={64}
              height={64}
              className="rounded-full border-2 border-blue-500 shadow"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center text-2xl font-bold text-blue-700">
              {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
            </div>
          )}
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">Hello, {session.user?.name || session.user?.email || "User"}!</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Welcome to your Smart Scanner dashboard.</p>
        </div>
        <div className="w-full flex flex-col items-center gap-6">
          {/* Add your dashboard widgets or features here */}
          <div className="w-full p-6 rounded-lg bg-blue-50 dark:bg-zinc-800 text-center shadow">
            <p className="text-lg text-blue-700 dark:text-blue-200 font-medium">Start scanning your documents or explore features!</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="mt-10 px-6 py-2 rounded-full bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </main>
    </div>
  );
}
