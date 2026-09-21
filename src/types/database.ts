export type UserRole = "user" | "admin";
export type UserStatus = "active" | "suspended" | "pending";
export type VerificationStatus = "none" | "pending" | "approved" | "rejected";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  referral_code: string | null;
  referred_by: string | null;
  role: UserRole;
  status: UserStatus;
  is_verified: boolean;
  verification_status: VerificationStatus;
  bio: string | null;
  language: string | null;
  timezone: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationTask {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  task_type: "whatsapp" | "referral" | "other";
  whatsapp_link: string | null;
  required_referrals: number;
  screenshot_required: boolean;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  task_id: string;
  status: RequestStatus;
  screenshot_path: string | null;
  note: string | null;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  profiles?: Pick<Profile, "display_name" | "email" | "avatar_url">;
  verification_tasks?: Pick<VerificationTask, "title" | "slug" | "task_type">;
}

export interface NavigationItem {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  href: string | null;
  description: string | null;
  enabled: boolean;
  sort_order: number;
  requires_auth: boolean;
  requires_verified: boolean;
}

export interface SectionIntro {
  id: string;
  section_slug: string;
  title: string;
  description: string | null;
  image_path: string | null;
  animation: string | null;
  button_text: string | null;
  enabled: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
