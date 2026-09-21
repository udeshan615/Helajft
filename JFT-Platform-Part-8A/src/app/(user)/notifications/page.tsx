import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">Notifications</h1>
      {!notifications?.length ? (
        <p className="text-slate-500 text-sm">No notifications yet.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id} className={`bg-white rounded-xl border border-slate-100 p-4 ${!n.read_at ? "border-l-4 border-l-indigo-500" : ""}`}>
              <div className="font-medium text-sm">{n.title}</div>
              {n.body && <p className="text-sm text-slate-600 mt-1">{n.body}</p>}
              <p className="text-xs text-slate-400 mt-2">{formatDate(n.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
