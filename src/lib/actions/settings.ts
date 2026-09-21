"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." as const, user: null };

  const { data: me } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!me || me.role !== "admin" || me.status !== "active") {
    return { error: "Forbidden." as const, user: null };
  }
  return { error: null, user };
}

/** Toggle profile photo upload (storage). When off → random avatars only. */
export async function setProfilePhotoEnabled(
  enabled: boolean
): Promise<ActionResult> {
  const { error, user } = await requireAdmin();
  if (error || !user) return { error: error || "Forbidden." };

  const admin = createAdminClient();
  const { error: upErr } = await admin.from("site_settings").upsert(
    {
      key: "profile_photo_enabled",
      value: enabled,
      description: "Allow users to upload profile photos to storage",
      updated_by: user.id,
    },
    { onConflict: "key" }
  );

  if (upErr) return { error: upErr.message };

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "settings.profile_photo_enabled",
    metadata: { enabled },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return {
    success: true,
    message: enabled
      ? "Profile photo upload enabled."
      : "Profile photo upload disabled. Users see random avatars.",
  };
}

/** WhatsApp verification: auto-approve on "I joined" (no screenshot, no admin review). */
export async function setWhatsappAutoApprove(
  enabled: boolean
): Promise<ActionResult> {
  const { error, user } = await requireAdmin();
  if (error || !user) return { error: error || "Forbidden." };

  const admin = createAdminClient();
  const { error: upErr } = await admin.from("site_settings").upsert(
    {
      key: "whatsapp_auto_approve",
      value: enabled,
      description:
        "When true, WhatsApp verification auto-approves without screenshot or admin review",
      updated_by: user.id,
    },
    { onConflict: "key" }
  );

  if (upErr) return { error: upErr.message };

  // Also force WhatsApp task to not require screenshot
  await admin
    .from("verification_tasks")
    .update({ screenshot_required: false })
    .eq("task_type", "whatsapp");

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "settings.whatsapp_auto_approve",
    metadata: { enabled },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/verification");
  revalidatePath("/verification");
  return {
    success: true,
    message: enabled
      ? "WhatsApp verification: auto-approve ON (no screenshot)."
      : "WhatsApp auto-approve OFF.",
  };
}

export async function updateWhatsappLink(
  link: string
): Promise<ActionResult> {
  const { error, user } = await requireAdmin();
  if (error || !user) return { error: error || "Forbidden." };

  const admin = createAdminClient();
  const { error: upErr } = await admin
    .from("verification_tasks")
    .update({ whatsapp_link: link.trim() || null })
    .eq("task_type", "whatsapp");

  if (upErr) return { error: upErr.message };

  revalidatePath("/admin/settings");
  revalidatePath("/verification");
  return { success: true, message: "WhatsApp link updated." };
}

/** Safe key-value settings only — NOT arbitrary SQL */
export async function getSiteSetting(key: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value;
}
