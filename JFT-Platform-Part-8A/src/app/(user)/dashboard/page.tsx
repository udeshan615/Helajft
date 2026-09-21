import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Profile, NavigationItem } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: navItems } = await supabase
    .from("navigation_items")
    .select("*")
    .eq("enabled", true)
    .order("sort_order");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user!.id)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const p = profile as Profile | null;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              p?.avatar_url ||
              `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(p?.display_name || p?.email || p?.id || "user")}`
            }
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate">
            {p?.display_name || p?.full_name || "Welcome"}
          </h1>
          <p className="text-sm text-slate-500 truncate">{p?.email}</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full ${p?.is_verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {p?.is_verified ? "Verified" : "Not verified"}
            </span>
            {p?.role === "admin" && (
              <Link href="/admin" className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Admin Panel
              </Link>
            )}
          </div>
        </div>
        <Link href="/profile" className="ml-auto text-sm text-indigo-600 hover:underline shrink-0">Edit</Link>
      </section>

      {notifications && notifications.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h2 className="font-medium mb-2">Notifications</h2>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className="text-sm border-l-2 border-indigo-400 pl-3 py-1">
                <span className="font-medium">{n.title}</span>
                {n.body && <p className="text-slate-500 text-xs mt-0.5">{n.body}</p>}
              </li>
            ))}
          </ul>
          <Link href="/notifications" className="text-xs text-indigo-600 mt-2 inline-block">View all</Link>
        </section>
      )}

      <section>
        <h2 className="font-medium mb-3 text-slate-700">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(navItems as NavigationItem[] | null)?.map((item) => (
            <Link key={item.id} href={item.href || "#"}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:border-indigo-200 hover:shadow transition">
              <div className="text-2xl mb-1">{item.icon || "📌"}</div>
              <div className="font-medium text-sm">{item.name}</div>
              {item.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl p-4">
        Part 8A foundation is live. Papers, Kanji, Games, Wallet, Referrals and other modules remain available as UI placeholders until their Part 8 migrations.
      </section>
    </div>
  );
}
