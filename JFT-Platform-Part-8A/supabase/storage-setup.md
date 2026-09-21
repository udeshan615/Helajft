# Supabase Storage Setup (Part 8A)

## Buckets to create (Dashboard → Storage)

### 1. `avatars` (public)
- Public bucket
- File size limit: 2 MB
- Allowed MIME: image/jpeg, image/png, image/webp, image/gif

**Policies (SQL):**

```sql
-- Public read
CREATE POLICY "Public avatar read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload/update their own folder
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 2. `verification-screenshots` (private)
- Private bucket
- File size limit: 5 MB
- Allowed MIME: image/jpeg, image/png, image/webp

**Policies:**

```sql
CREATE POLICY "Users upload own verification screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read own screenshots
CREATE POLICY "Users read own verification screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins read via service role / signed URLs (no direct policy needed for service role)
```

Admin review uses the service-role client to create short-lived signed URLs.
