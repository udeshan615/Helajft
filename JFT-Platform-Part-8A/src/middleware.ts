import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedUserPaths = [
  "/dashboard",
  "/profile",
  "/verification",
  "/notifications",
  "/earnings",
  "/referral",
  "/papers",
  "/kanji",
  "/practice",
  "/daily-game",
];

const adminPaths = ["/admin"];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Protected user routes
  const isProtected = protectedUserPaths.some(
    (p) => path === p || path.startsWith(p + "/")
  );
  const isAdminRoute = adminPaths.some(
    (p) => path === p || path.startsWith(p + "/")
  );

  if ((isProtected || isAdminRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Admin routes — server-side role check
  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin" || profile.status !== "active") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && (path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
