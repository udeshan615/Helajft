import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/types/database";

const nav = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/verification", label: "Verify", icon: "✅" },
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/notifications", label: "Alerts", icon: "🔔" },
];

export function UserShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-indigo-700 text-lg">
            JFT
          </Link>
          <div className="flex items-center gap-3">
            {profile?.is_verified && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Verified
              </span>
            )}
            <span className="text-sm text-slate-600 hidden sm:inline">
              {profile?.display_name || profile?.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-slate-500 hover:text-red-600"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>

      {/* Bottom nav — Android first */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 safe-bottom md:hidden z-40">
        <div className="flex justify-around py-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center text-xs text-slate-600 hover:text-indigo-600 px-2"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
