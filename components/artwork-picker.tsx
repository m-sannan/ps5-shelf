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
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CoverHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    const q = query.trim() || title;
    if (q.length < 2) {
      setError("Type a title first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/covers?q=${encodeURIComponent(q)}`);
      const text = await response.text();
      let data: { covers?: CoverHit[]; error?: string } = {};
      try {
        data = JSON.parse(text) as { covers?: CoverHit[]; error?: string };
      } catch {
        setError("Search failed. Try again.");
        return;
      }
      const covers = (data.covers ?? []).filter(
        (hit) => !hit.url.toLowerCase().includes(".svg"),
      );
      setHits(covers);
      if (!covers.length) setError(data.error || "No box art found. Try a shorter name.");
    } catch {
      setError("Could not search right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={title || "Search box art"}
          className="min-w-0"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              void search();
            }
          }}
        />
        <Button type="button" size="sm" disabled={loading} onClick={() => void search()}>
          {loading ? "Searching…" : "Find art"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hits.length > 0 && (
        <div className="grid max-h-56 min-w-0 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
          {hits.map((hit, index) => (
            <button
              key={`${hit.url}-${index}`}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onPick(hit.url);
              }}
              className={`min-w-0 overflow-hidden rounded-md ring-2 ${
                current === hit.url ? "ring-sky-300" : "ring-transparent hover:ring-white/40"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artSrc(hit.url)}
                alt={hit.label}
                className="aspect-[2/3] h-auto w-full max-w-full object-cover"
              />
              <span className="block truncate bg-black/50 px-1 py-0.5 text-[10px] text-white/80">
                {hit.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
