"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth";

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const fullName = String(formData.get("full_name") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const bio = String(formData.get("bio") || "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      display_name: displayName || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      bio: bio || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, message: "Profile updated." };
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "profile_photo_enabled")
    .maybeSingle();

  const enabled = setting?.value === true || setting?.value === "true";

  if (!enabled) {
    return {
      error:
        "Profile photo upload is disabled by admin. A random avatar is used instead.",
    };
  }

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "No file selected." };

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return { error: "Only JPEG, PNG, WebP or GIF allowed." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "Max file size is 2 MB." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, message: "Avatar updated." };
}

export async function setUserStatus(
  userId: string,
  status: "active" | "suspended"
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!me || me.role !== "admin") return { error: "Forbidden." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status })
    .eq("id", userId);

  if (error) return { error: error.message };

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: status === "suspended" ? "user.suspend" : "user.activate",
    target_type: "profile",
    target_id: userId,
  });

  revalidatePath("/admin/users");
  return { success: true, message: `User ${status}.` };
}
