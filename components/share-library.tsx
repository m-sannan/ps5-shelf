"use client";

import { useMemo, useRef, useState } from "react";
import { GameGrid } from "@/components/game-grid";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { publicShelfPath } from "@/lib/cloud/client";
import { copyText, selectField } from "@/lib/copy-text";
import { money } from "@/lib/format";
import { libraryStats } from "@/lib/stats";

export function ShareLibrary() {
  const { library, ready, cloud } = useLibrary();
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState("");
  const fieldRef = useRef<HTMLInputElement>(null);
  const stats = libraryStats(library);
  const listed = useMemo(
    () => library.games.filter((game) => game.status !== "sold"),
    [library.games],
  );
  const currency = library.profile.currency;
  const shareUrl =
    typeof window !== "undefined" && cloud?.publicId
      ? `${window.location.origin}${publicShelfPath(cloud.publicId)}`
      : cloud?.publicId
        ? publicShelfPath(cloud.publicId)
        : "";

  async function copyLink() {
    if (!shareUrl) {
      setHint("Share links are available after this shelf is online.");
      return;
    }
    const result = await copyText(shareUrl);
    if (result === "copied") {
      setCopied(true);
      setHint("");
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    selectField(fieldRef.current);
    setHint("Clipboard is blocked in this window. Select the link and copy it.");
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
            {library.profile.name}'s library
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
          <p className="mt-2 max-w-xl text-xs text-white/40">
            This page is your seller view. The public link is read-only and never
            includes your device key.
          </p>
        </div>
        <Button onClick={copyLink}>{copied ? "Link copied" : "Copy share link"}</Button>
      </div>
      {shareUrl && (
        <div className="max-w-xl space-y-2">
          <input
            ref={fieldRef}
            readOnly
            value={shareUrl}
            onFocus={(event) => selectField(event.currentTarget)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 font-mono text-xs text-foreground"
          />
          {hint && <p className="text-sm text-white/60">{hint}</p>}
        </div>
      )}
      <GameGrid games={listed} readOnly currency={currency} />
    </div>
  );
}
