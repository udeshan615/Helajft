"use client";

import { useState } from "react";
import Link from "next/link";
import { updatePassword } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true); setError(null);
    const result = await updatePassword(formData);
    if (result?.error) setError(result.error);
    else if (result?.message) setSuccess(result.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-indigo-700 text-center mb-6">Set New Password</h1>
        {success ? (
          <div className="text-center space-y-4">
            <div className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">{success}</div>
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">Go to Login</Link>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <input name="password" type="password" required minLength={8}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="New password (min 8)" />
            {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium hover:bg-indigo-700 disabled:opacity-60">
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
