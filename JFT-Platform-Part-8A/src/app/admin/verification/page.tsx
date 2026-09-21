import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviewVerificationRequest } from "@/lib/actions/verification";
import { formatDate } from "@/lib/utils";

export default async function AdminVerificationPage() {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("verification_requests")
    .select(
      `
      *,
      profiles:user_id ( display_name, email, avatar_url ),
      verification_tasks:task_id ( title, slug, task_type )
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  async function getSignedUrl(path: string | null) {
    if (!path) return null;
    try {
      const admin = createAdminClient();
      const { data } = await admin.storage
        .from("verification-screenshots")
        .createSignedUrl(path, 3600);
      return data?.signedUrl || null;
    } catch {
      return null;
    }
  }

  // Pre-sign screenshots for pending
  const withUrls = await Promise.all(
    (requests || []).map(async (r) => ({
      ...r,
      signedUrl: r.status === "pending" ? await getSignedUrl(r.screenshot_path) : null,
    }))
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Verification Requests</h1>

      <div className="space-y-3">
        {withUrls.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium">
                {(r.profiles as { display_name?: string })?.display_name || "User"}
              </div>
              <div className="text-xs text-slate-500">
                {(r.profiles as { email?: string })?.email}
              </div>
              <div className="text-sm mt-1">
                Task:{" "}
                {(r.verification_tasks as { title?: string })?.title || "—"}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {formatDate(r.created_at)} ·{" "}
                <span className="capitalize">{r.status}</span>
              </div>
              {r.note && (
                <p className="text-sm text-slate-600 mt-1">Note: {r.note}</p>
              )}
              {r.signedUrl && (
                <a
                  href={r.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline mt-1 inline-block"
                >
                  View screenshot →
                </a>
              )}
            </div>

            {r.status === "pending" && (
              <div className="flex gap-2 shrink-0">
                <form
                  action={async () => {
                    "use server";
                    await reviewVerificationRequest(r.id, "approved");
                  }}
                >
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg"
                  >
                    Approve
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await reviewVerificationRequest(r.id, "rejected", "Does not meet requirements");
                  }}
                >
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg"
                  >
                    Reject
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}

        {!withUrls.length && (
          <p className="text-slate-500 text-sm">No verification requests yet.</p>
        )}
      </div>
    </div>
  );
}
