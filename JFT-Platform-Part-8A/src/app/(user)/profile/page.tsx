"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, uploadAvatar } from "@/lib/actions/profile";
import type { Profile } from "@/types/database";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data as Profile);
    });
  }, []);

  async function handleUpdate(formData: FormData) {
    setLoading(true); setErr(null); setMsg(null);
    const r = await updateProfile(formData);
    if (r.error) setErr(r.error);
    else setMsg(r.message || "Saved");
    setLoading(false);
  }

  async function handleAvatar(formData: FormData) {
    setLoading(true); setErr(null); setMsg(null);
    const r = await uploadAvatar(formData);
    if (r.error) setErr(r.error);
    else {
      setMsg(r.message || "Avatar updated");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(data as Profile);
      }
    }
    setLoading(false);
  }

  if (!profile) return <div className="text-center py-12 text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">My Profile</h1>
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl text-indigo-600">{(profile.display_name || "?")[0].toUpperCase()}</span>
          )}
        </div>
        <form action={handleAvatar} className="flex-1">
          <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp,image/gif" className="text-sm w-full" />
          <button type="submit" disabled={loading} className="mt-2 text-sm text-indigo-600 hover:underline">Upload photo</button>
        </form>
      </div>
      <form action={handleUpdate} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <input name="full_name" defaultValue={profile.full_name || ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Display Name</label>
          <input name="display_name" defaultValue={profile.display_name || ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input name="phone" defaultValue={profile.phone || ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">WhatsApp</label>
          <input name="whatsapp" defaultValue={profile.whatsapp || ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Bio</label>
          <textarea name="bio" defaultValue={profile.bio || ""} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div className="text-xs text-slate-500">Email: {profile.email} · Referral code: {profile.referral_code}</div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        {msg && <div className="text-sm text-green-600">{msg}</div>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 text-white py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-60">
          {loading ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
