/**
 * Deterministic avatar URL from seed (email / name / id).
 * Uses DiceBear (no storage, no upload).
 */
export function randomAvatarUrl(seed: string): string {
  const s = encodeURIComponent(seed || "user");
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${s}`;
}

export function displayAvatar(
  profile: {
    avatar_url?: string | null;
    email?: string | null;
    display_name?: string | null;
    id?: string;
  } | null,
  photoEnabled: boolean
): string {
  if (photoEnabled && profile?.avatar_url) {
    return profile.avatar_url;
  }
  const seed =
    profile?.display_name || profile?.email || profile?.id || "user";
  return randomAvatarUrl(seed);
}
