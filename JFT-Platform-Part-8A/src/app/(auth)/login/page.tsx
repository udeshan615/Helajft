"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-700">JFT Platform</h1>
          <p className="text-slate-500 mt-1">Sign in to continue</p>
        </div>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input name="email" type="email" required autoComplete="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input name="password" type="password" required autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium hover:bg-indigo-700 disabled:opacity-60 transition">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-500 space-y-2">
          <p><Link href="/forgot-password" className="text-indigo-600 hover:underline">Forgot password?</Link></p>
          <p>Don&apos;t have an account? <Link href="/register" className="text-indigo-600 font-medium hover:underline">Register</Link></p>
        </div>
      </div>
    </div>
  );
}
