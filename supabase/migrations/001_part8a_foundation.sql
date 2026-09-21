-- Part 8A Foundation Migration
-- profiles, verification_tasks, verification_requests,
-- navigation_items, section_intros, site_settings,
-- notifications, audit_logs

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'none'
    CHECK (verification_status IN ('none', 'pending', 'approved', 'rejected')),
  bio TEXT,
  language TEXT DEFAULT 'si',
  timezone TEXT DEFAULT 'Asia/Colombo',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================
-- VERIFICATION TASKS (admin-configurable)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.verification_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('whatsapp', 'referral', 'other')),
  whatsapp_link TEXT,
  required_referrals INTEGER DEFAULT 0,
  screenshot_required BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_tasks_enabled ON public.verification_tasks(enabled);

-- ============================================================
-- VERIFICATION REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.verification_tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  screenshot_path TEXT,
  note TEXT,
  admin_note TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_task ON public.verification_requests(task_id);

-- ============================================================
-- NAVIGATION ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  href TEXT,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  requires_auth BOOLEAN NOT NULL DEFAULT false,
  requires_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_navigation_items_enabled ON public.navigation_items(enabled);
CREATE INDEX IF NOT EXISTS idx_navigation_items_sort ON public.navigation_items(sort_order);

-- ============================================================
-- SECTION INTROS (popups)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.section_intros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  image_path TEXT,
  animation TEXT,
  button_text TEXT DEFAULT 'Continue',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User dismissals of section intros
CREATE TABLE IF NOT EXISTS public.section_intro_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section_slug TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_slug)
);

-- ============================================================
-- SITE SETTINGS (key-value)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info'
    CHECK (type IN ('info', 'success', 'warning', 'error', 'verification', 'system')),
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER verification_tasks_updated_at
  BEFORE UPDATE ON public.verification_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER navigation_items_updated_at
  BEFORE UPDATE ON public.navigation_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER section_intros_updated_at
  BEFORE UPDATE ON public.section_intros
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_intros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_intro_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile (limited fields)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND status = (SELECT status FROM public.profiles WHERE id = auth.uid())
    AND is_verified = (SELECT is_verified FROM public.profiles WHERE id = auth.uid())
    AND verification_status = (SELECT verification_status FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- VERIFICATION TASKS
CREATE POLICY "Anyone can read enabled tasks"
  ON public.verification_tasks FOR SELECT
  USING (enabled = true OR public.is_admin());

CREATE POLICY "Admins manage verification tasks"
  ON public.verification_tasks FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- VERIFICATION REQUESTS
CREATE POLICY "Users can view own requests"
  ON public.verification_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create own requests"
  ON public.verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users cannot update status of requests"
  ON public.verification_requests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND status = (SELECT status FROM public.verification_requests WHERE id = verification_requests.id)
  );

CREATE POLICY "Admins manage verification requests"
  ON public.verification_requests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NAVIGATION
CREATE POLICY "Anyone can read enabled nav"
  ON public.navigation_items FOR SELECT
  USING (enabled = true OR public.is_admin());

CREATE POLICY "Admins manage navigation"
  ON public.navigation_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SECTION INTROS
CREATE POLICY "Anyone can read enabled intros"
  ON public.section_intros FOR SELECT
  USING (enabled = true OR public.is_admin());

CREATE POLICY "Admins manage section intros"
  ON public.section_intros FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users manage own dismissals"
  ON public.section_intro_dismissals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SITE SETTINGS
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage site settings"
  ON public.site_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications (mark read)"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins / service can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() = user_id);

-- AUDIT LOGS (admin read only; inserts via service role / server)
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Authenticated can insert audit (server will use service role preferably)"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- SEED minimal data
-- ============================================================
INSERT INTO public.verification_tasks (slug, title, description, task_type, whatsapp_link, screenshot_required, enabled, sort_order)
VALUES
  ('whatsapp-join', 'Join WhatsApp Group', 'Join the official JFT WhatsApp group, then tap Confirm. No screenshot required.', 'whatsapp', 'https://chat.whatsapp.com/example', false, true, 1),
  ('referral-verify', 'Referral Verification', 'Invite the required number of friends who successfully register and complete their profile.', 'referral', NULL, false, true, 2)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.navigation_items (name, slug, icon, href, description, enabled, sort_order, requires_auth)
VALUES
  ('Home', 'home', 'home', '/dashboard', 'Dashboard', true, 1, true),
  ('Papers', 'papers', 'book', '/papers', 'Model & Past Papers', true, 2, true),
  ('Kanji', 'kanji', 'type', '/kanji', 'Kanji Study', true, 3, true),
  ('Practice', 'practice', 'pen', '/practice', 'Grammar / Listening / Reading', true, 4, true),
  ('Games', 'games', 'gamepad', '/daily-game', 'Daily Games', true, 5, true),
  ('Earnings', 'earnings', 'wallet', '/earnings', 'Wallet & Withdrawals', true, 6, true),
  ('Referral', 'referral', 'users', '/referral', 'Referral Program', true, 7, true),
  ('Verification', 'verification', 'shield', '/verification', 'Account Verification', true, 8, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.site_settings (key, value, description)
VALUES
  ('site_name', '"JFT Platform"', 'Site display name'),
  ('maintenance_mode', 'false', 'Maintenance mode flag'),
  ('require_verification_for_past_papers', 'true', 'Past papers require verified status')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value, description)
VALUES
  ('profile_photo_enabled', 'false', 'Allow profile photo uploads to storage. When false, random avatars are used.'),
  ('whatsapp_auto_approve', 'true', 'Auto-approve WhatsApp verification without screenshot or admin review')
ON CONFLICT (key) DO NOTHING;

