"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function signUp(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, display_name: fullName || email.split("@")[0] },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user && !data.session) {
    // Email confirmation required
    return {
      success: true,
      message: "Check your email to verify your account before logging in.",
    };
  }

  redirect("/complete-profile");
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Update last_login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) return { error: error.message };

  return {
    success: true,
    message: "If an account exists, a password reset link has been sent.",
  };
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  return { success: true, message: "Password updated. You can now log in." };
}

export async function completeProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const fullName = String(formData.get("full_name") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      display_name: displayName || fullName || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Server-only: promote a user to admin (use carefully, e.g. from a one-time script) */
export async function promoteToAdmin(userId: string): Promise<ActionResult> {
  // This should only be callable from a trusted environment / first-admin script.
  // In production use the SQL method documented in README.
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);

  if (error) return { error: error.message };
  return { success: true };
}
