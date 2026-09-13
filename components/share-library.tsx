"use client";

import { useMemo, useState } from "react";
import { GameGrid } from "@/components/game-grid";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { libraryStats } from "@/lib/stats";

export function ShareLibrary() {
  const { library, ready } = useLibrary();
  const [copied, setCopied] = useState(false);
  const stats = libraryStats(library);
  const listed = useMemo(
    () => library.games.filter((game) => game.status !== "sold"),
    [library.games],
  );
  const currency = library.profile.currency;

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/share`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!ready) {
    return <p className="text-sm text-white/50">Opening the library…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
            For sale & show-around
          </p>
          <h1 className="mt-1 text-2xl font-medium">
            {library.profile.name}&apos;s library
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {library.profile.city}
            {library.profile.city && library.profile.contact ? " · " : ""}
            {library.profile.contact}
          </p>
          <p className="mt-3 max-w-2xl text-sm text-white/70">{library.profile.note}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/60">
            <span>{listed.length} copies</span>
            <span>·</span>
            <span>{stats.forSale} listed</span>
            <span>·</span>
            <span>Asking {money(stats.asking, currency)}</span>
          </div>
        </div>
        <Button onClick={copyLink}>{copied ? "Link copied" : "Copy share link"}</Button>
      </div>
      <GameGrid games={listed} readOnly />
    </div>
  );
}
