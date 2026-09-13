"use client";

export function artSrc(url: string | null | undefined) {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("/")) return url;
  return `/api/art?url=${encodeURIComponent(url)}`;
}
