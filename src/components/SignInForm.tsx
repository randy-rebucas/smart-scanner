"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
    } else {
      window.location.href = "/";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      <h2 className="text-xl font-semibold text-center">Sign in with Email</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border rounded px-3 py-2"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border rounded px-3 py-2"
        required
      />
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      <button
        type="submit"
        className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition-colors"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
