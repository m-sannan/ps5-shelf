"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { artSrc } from "@/lib/art-src";
import type { CoverHit } from "@/lib/covers";

export function ArtworkPicker({
  title,
  current,
  onPick,
}: {
  title: string;
  current: string | null;
  onPick: (url: string) => void;
}) {
  const [query, setQuery] = useState(title);
  const [hits, setHits] = useState<CoverHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(event?: React.FormEvent) {
    event?.preventDefault();
    const q = query.trim() || title;
    if (q.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/covers?q=${encodeURIComponent(q)}`);
      const data = (await response.json()) as { covers?: CoverHit[]; error?: string };
      setHits(data.covers ?? []);
      if (!data.covers?.length) setError("No box art found. Try a shorter name.");
    } catch {
      setError("Could not search right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={search} className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search box art"
        />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Searching…" : "Find art"}
        </Button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hits.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {hits.map((hit) => (
            <button
              key={hit.url}
              type="button"
              onClick={() => onPick(hit.url)}
              className={`overflow-hidden rounded-md ring-2 ${
                current === hit.url ? "ring-white" : "ring-transparent hover:ring-white/40"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artSrc(hit.url)}
                alt={hit.label}
                className="aspect-[2/3] w-full object-cover"
              />
              <span className="block truncate bg-black/50 px-1 py-0.5 text-[10px] text-white/80">
                {hit.source}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
