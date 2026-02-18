"use client";
export default function SignInButton() {
  return (
    <div className="flex flex-col gap-2 w-full">
      <a
        href="/api/auth/signin/github"
        className="px-6 py-2 rounded-full bg-gray-800 text-white font-semibold shadow hover:bg-gray-900 transition-colors text-center"
      >
        Sign in with GitHub
      </a>
      <a
        href="/signin"
        className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors text-center"
      >
        Sign in with Email
      </a>
    </div>
  );
}