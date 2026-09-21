"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true); setError(null); setSuccess(null);
    const result = await requestPasswordReset(formData);
    if (result?.error) setError(result.error);
    else if (result?.message) setSuccess(result.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-indigo-700 text-center mb-2">Reset Password</h1>
        <p className="text-slate-500 text-center text-sm mb-6">Enter your email and we&apos;ll send a reset link.</p>
        {success ? (
          <div className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3 text-center">{success}</div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <input name="email" type="email" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="you@example.com" />
            {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium hover:bg-indigo-700 disabled:opacity-60">
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm"><Link href="/login" className="text-indigo-600 hover:underline">Back to Login</Link></p>
      </div>
    </div>
  );
}
