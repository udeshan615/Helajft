"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitVerificationRequest } from "@/lib/actions/verification";
import type {
  VerificationTask,
  VerificationRequest,
  Profile,
} from "@/types/database";

export default function VerificationPage() {
  const [tasks, setTasks] = useState<VerificationTask[]>([]);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [t, r, p] = await Promise.all([
      supabase
        .from("verification_tasks")
        .select("*")
        .eq("enabled", true)
        .order("sort_order"),
      supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    setTasks((t.data as VerificationTask[]) || []);
    setRequests((r.data as VerificationRequest[]) || []);
    setProfile(p.data as Profile);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setErr(null);
    setMsg(null);
    const result = await submitVerificationRequest(formData);
    if (result.error) setErr(result.error);
    else {
      setMsg(result.message || "Submitted");
      await load();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold">Account Verification</h1>
        <p className="text-sm text-slate-500 mt-1">
          Status:{" "}
          <span className="font-medium capitalize">
            {profile?.verification_status || "none"}
          </span>
          {profile?.is_verified && " ✓"}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        WhatsApp verification does <strong>not</strong> need a screenshot.
        Join the group, then tap Confirm. Storage is not used for this step.
      </div>

      {tasks.map((task) => {
        const myReq = requests.find(
          (r) => r.task_id === task.id && r.status !== "rejected"
        );
        const isWhatsapp = task.task_type === "whatsapp";

        return (
          <div
            key={task.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3"
          >
            <h2 className="font-semibold">{task.title}</h2>
            {task.description && (
              <p className="text-sm text-slate-600">{task.description}</p>
            )}

            {isWhatsapp && task.whatsapp_link && (
              <a
                href={task.whatsapp_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100"
              >
                Open WhatsApp Group →
              </a>
            )}

            {task.task_type === "referral" && (
              <p className="text-sm text-slate-600">
                Required successful referrals: {task.required_referrals}
              </p>
            )}

            {myReq ? (
              <div className="text-sm">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    myReq.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : myReq.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {myReq.status}
                </span>
                {myReq.admin_note && (
                  <p className="mt-1 text-slate-500">
                    Admin: {myReq.admin_note}
                  </p>
                )}
              </div>
            ) : (
              <form action={handleSubmit} className="space-y-3">
                <input type="hidden" name="task_id" value={task.id} />
                {!isWhatsapp && task.screenshot_required && (
                  <div>
                    <label className="text-sm font-medium">
                      Screenshot proof
                    </label>
                    <input
                      type="file"
                      name="screenshot"
                      accept="image/jpeg,image/png,image/webp"
                      className="mt-1 block w-full text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Note (optional)</label>
                  <input
                    name="note"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder={
                      isWhatsapp
                        ? "Optional — e.g. your WhatsApp name"
                        : "Any additional info"
                    }
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 text-white py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading
                    ? "Submitting…"
                    : isWhatsapp
                      ? "I joined — Confirm"
                      : "Submit for Review"}
                </button>
              </form>
            )}
          </div>
        );
      })}

      {err && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      {msg && (
        <div className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}
    </div>
  );
}
