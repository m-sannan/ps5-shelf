const RESERVED = new Set([
  "api",
  "s",
  "share",
  "settings",
  "ledger",
  "library",
  "money",
  "public",
  "cloud",
  "art",
  "covers",
  "create",
  "join",
  "pair",
  "shelf",
  "health",
  "crate",
  "admin",
  "www",
  "static",
  "favicon",
  "login",
  "signup",
  "me",
  "new",
  "edit",
  "app",
]);

export function normalizeHandle(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
}

export function isHandle(value: string) {
  return /^[a-z][a-z0-9_-]{2,23}$/.test(value) && !RESERVED.has(value);
}

export function handleError(value: string) {
  const normalized = normalizeHandle(value);
  if (!normalized) return "";
  if (normalized.length < 3) return "Use at least 3 characters.";
  if (!/^[a-z]/.test(normalized)) return "Start with a letter.";
  if (RESERVED.has(normalized)) return "That name is reserved.";
  if (!isHandle(normalized)) return "Letters, numbers, hyphen, underscore.";
  return "";
}

export function cratePath(publicId: string, handle?: string | null) {
  const slug = handle ? normalizeHandle(handle) : "";
  if (slug && isHandle(slug)) return `/s/${encodeURIComponent(slug)}`;
  return `/s/${encodeURIComponent(publicId)}`;
}
