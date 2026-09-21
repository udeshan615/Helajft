import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: pendingVerifs },
    { count: verifiedCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("verification_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="text-3xl font-bold text-indigo-600">{userCount ?? 0}</div>
          <div className="text-sm text-slate-500">Total Users</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-3xl font-bold text-amber-600">
            {pendingVerifs ?? 0}
          </div>
          <div className="text-sm text-slate-500">Pending Verifications</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-3xl font-bold text-green-600">
            {verifiedCount ?? 0}
          </div>
          <div className="text-sm text-slate-500">Verified Users</div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
        >
          Manage Users
        </Link>
        <Link
          href="/admin/verification"
          className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm"
        >
          Review Verifications
        </Link>
      </div>

      <p className="text-xs text-slate-400 border border-dashed rounded-xl p-4">
        Part 8A: Core Auth, Profiles, Verification, Navigation & Admin RBAC.
        Wallet, Games, Papers, etc. will be added in later Part 8 modules.
      </p>
    </div>
  );
}
