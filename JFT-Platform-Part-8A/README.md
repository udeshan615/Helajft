# JFT Platform — Part 8A (v0.1.1)

Next.js 15 + Supabase Auth/DB + **custom Gmail SMTP** (not Supabase email).

## Changes in this update

1. **Email** — Your Gmail + App Password via nodemailer (avoids Supabase email limits)
2. **Profile photo** — Admin toggle ON/OFF. OFF = random DiceBear avatar (no storage)
3. **WhatsApp verification** — No screenshot, no storage. Auto-approve ON by default
4. **Admin Settings** — Toggles for photo + WhatsApp (no raw SQL in browser — unsafe)

## Quick setup

1. Create Supabase project
2. Run `supabase/migrations/001_part8a_foundation.sql`
3. Optional: Storage bucket `avatars` only if you enable profile photos
4. Copy `.env.example` → `.env.local` and fill:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_APP_PASSWORD=your-16-char-app-password
EMAIL_FROM="JFT Platform <your@gmail.com>"
```

5. Gmail App Password: Google Account → Security → 2-Step Verification → App passwords
6. `npm install && npm run dev`
7. Register → SQL promote to admin:

```sql
UPDATE public.profiles SET role = 'admin', status = 'active'
WHERE email = 'your@email.com';
```

8. Admin → Settings: control photo upload + WhatsApp auto-approve + group link

## First admin

Never self-promote from the browser. Use SQL Editor only.

## Security

- Service role key: server only
- No arbitrary SQL in admin UI
- Users cannot change role / verification_status via RLS
