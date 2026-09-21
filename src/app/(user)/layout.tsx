import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserShell } from "@/components/layout/UserShell";
import type { Profile } from "@/types/database";

export default async function UserLayout({
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
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <UserShell profile={profile as Profile | null}>{children}</UserShell>
  );
}
