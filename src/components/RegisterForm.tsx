"use client";
import { useState } from "react";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      setSuccess("Registration successful! You can now sign in.");
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      <h2 className="text-xl font-semibold text-center">Register</h2>
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
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        className="border rounded px-3 py-2"
        required
      />
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      {success && <div className="text-green-600 text-sm text-center">{success}</div>}
      <button
        type="submit"
        className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition-colors"
        disabled={loading}
      >
        {loading ? "Registering..." : "Register"}
      </button>
    </form>
  );
}
