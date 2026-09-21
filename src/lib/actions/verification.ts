"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth";

/**
 * WhatsApp verification: NO screenshot / NO storage by default.
 * If site_settings.whatsapp_auto_approve = true → auto approve on submit.
 * Admin never receives screenshot files.
 */
export async function submitVerificationRequest(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const taskId = String(formData.get("task_id") || "");
  const note = String(formData.get("note") || "").trim();

  if (!taskId) return { error: "Task is required." };

  const { data: task } = await supabase
    .from("verification_tasks")
    .select("*")
    .eq("id", taskId)
    .eq("enabled", true)
    .single();

  if (!task) return { error: "Invalid or disabled task." };

  const { data: existing } = await supabase
    .from("verification_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("task_id", taskId)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing) {
    return {
      error:
        existing.status === "approved"
          ? "Already verified for this task."
          : "You already have a pending request for this task.",
    };
  }

  // WhatsApp: never require screenshot (storage-safe)
  const isWhatsapp = task.task_type === "whatsapp";

  // Read auto-approve setting
  const { data: autoSetting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "whatsapp_auto_approve")
    .maybeSingle();

  const autoApprove =
    isWhatsapp &&
    (autoSetting?.value === true || autoSetting?.value === "true");

  const status = autoApprove ? "approved" : "pending";

  const { error } = await supabase.from("verification_requests").insert({
    user_id: user.id,
    task_id: taskId,
    status,
    screenshot_path: null, // never store screenshots for WhatsApp
    note: note || null,
    reviewed_at: autoApprove ? new Date().toISOString() : null,
  });

  if (error) return { error: error.message };

  if (autoApprove) {
    // Use admin client for privileged profile update
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        verification_status: "approved",
        is_verified: true,
      })
      .eq("id", user.id);

    await admin.from("notifications").insert({
      user_id: user.id,
      title: "Verification Approved",
      body: "Your WhatsApp verification was approved automatically.",
      type: "verification",
      link: "/verification",
    });

    revalidatePath("/verification");
    revalidatePath("/dashboard");
    return {
      success: true,
      message: "Verified successfully. No screenshot needed.",
    };
  }

  await supabase
    .from("profiles")
    .update({ verification_status: "pending" })
    .eq("id", user.id);

  revalidatePath("/verification");
  return {
    success: true,
    message:
      "Request submitted. Admin will review (no screenshot uploaded).",
  };
}

export async function reviewVerificationRequest(
  requestId: string,
  decision: "approved" | "rejected",
  adminNote?: string
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

  const { data: req, error: fetchErr } = await admin
    .from("verification_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchErr || !req) return { error: "Request not found." };
  if (req.status !== "pending") return { error: "Request already reviewed." };

  const { error } = await admin
    .from("verification_requests")
    .update({
      status: decision,
      admin_note: adminNote || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  await admin
    .from("profiles")
    .update({
      verification_status: decision,
      is_verified: decision === "approved",
    })
    .eq("id", req.user_id);

  await admin.from("notifications").insert({
    user_id: req.user_id,
    title:
      decision === "approved"
        ? "Verification Approved"
        : "Verification Rejected",
    body:
      decision === "approved"
        ? "Your verification request has been approved."
        : `Rejected.${adminNote ? " " + adminNote : ""}`,
    type: "verification",
    link: "/verification",
  });

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: `verification.${decision}`,
    target_type: "verification_request",
    target_id: requestId,
    metadata: { user_id: req.user_id, admin_note: adminNote },
  });

  revalidatePath("/admin/verification");
  revalidatePath("/verification");
  return { success: true, message: `Request ${decision}.` };
}
