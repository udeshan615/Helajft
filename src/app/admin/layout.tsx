import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/verification", label: "Verification" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, display_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="md:w-56 bg-slate-900 text-white p-4 shrink-0">
        <div className="font-bold text-lg mb-6">JFT Admin</div>
        <nav className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-800"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800"
          >
            ← User App
          </Link>
        </nav>
        <form action={signOut} className="mt-8">
          <button type="submit" className="text-xs text-slate-400 hover:text-white">
            Logout ({profile.display_name})
          </button>
        </form>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}
