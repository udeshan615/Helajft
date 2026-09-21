"use client";

import { useState } from "react";
import { completeProfile } from "@/lib/actions/auth";

export default function CompleteProfilePage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true); setError(null);
    const result = await completeProfile(formData);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-indigo-700 text-center mb-2">Complete Your Profile</h1>
        <p className="text-slate-500 text-center text-sm mb-6">Tell us a bit more about yourself</p>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input name="full_name" type="text" required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
            <input name="display_name" type="text" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input name="phone" type="tel" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
            <input name="whatsapp" type="tel" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium hover:bg-indigo-700 disabled:opacity-60">
            {loading ? "Saving…" : "Continue to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
