import { createClient } from "@/lib/supabase/server";
import { setUserStatus } from "@/lib/actions/profile";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(
      `email.ilike.%${q}%,display_name.ilike.%${q}%,full_name.ilike.%${q}%`
    );
  }

  const { data: users } = await query;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search email or name…"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
        >
          Search
        </button>
      </form>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Verified</th>
              <th className="px-3 py-2">Joined</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users as Profile[] | null)?.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium">{u.display_name || "—"}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="px-3 py-2 capitalize">{u.role}</td>
                <td className="px-3 py-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      u.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {u.is_verified ? "✓" : "—"}
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {formatDate(u.created_at)}
                </td>
                <td className="px-3 py-2">
                  {u.role !== "admin" && (
                    <form
                      action={async () => {
                        "use server";
                        await setUserStatus(
                          u.id,
                          u.status === "active" ? "suspended" : "active"
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        {u.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
