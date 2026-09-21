"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await signUp(formData);
    if (result?.error) { setError(result.error); setLoading(false); }
    else if (result?.message) { setSuccess(result.message); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-700">Create Account</h1>
          <p className="text-slate-500 mt-1">Join JFT Platform</p>
        </div>
        {success ? (
          <div className="text-center space-y-4">
            <div className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">{success}</div>
            <Link href="/login" className="inline-block text-indigo-600 font-medium hover:underline">Go to Login</Link>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input name="full_name" type="text" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input name="email" type="email" required autoComplete="email" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Min 8 characters" />
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium hover:bg-indigo-700 disabled:opacity-60 transition">
              {loading ? "Creating…" : "Register"}
            </button>
          </form>
        )}
        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
