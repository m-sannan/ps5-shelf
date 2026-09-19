"use client";

import { useMemo, useRef, useState } from "react";
import { GameGrid } from "@/components/game-grid";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { publicShelfPath } from "@/lib/cloud/client";
import { copyText, selectField } from "@/lib/copy-text";
import { money } from "@/lib/format";
import { isForSale } from "@/lib/photos";

export function ShareLibrary() {
  const { library, ready, cloud } = useLibrary();
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState("");
  const fieldRef = useRef<HTMLInputElement>(null);
  const forSale = useMemo(
    () => library.games.filter(isForSale),
    [library.games],
  );
  const rest = useMemo(
    () => library.games.filter((game) => game.status !== "sold" && !isForSale(game)),
    [library.games],
  );
  const currency = library.profile.currency;
  const asking = forSale.reduce((sum, game) => sum + (game.askingPrice ?? 0), 0);
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
    <div className="min-w-0 space-y-8">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
            What friends see
          </p>
          <h1 className="mt-1 text-2xl font-medium">
            {library.profile.name}'s library
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            This is a preview of your public link. Listed copies show first with
            asking price and condition. What you paid stays private.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/60">
            <span>{forSale.length} for sale</span>
            <span>·</span>
            <span>{rest.length} on the shelf</span>
            {forSale.length > 0 && (
              <>
                <span>·</span>
                <span>Asking {money(asking, currency)}</span>
              </>
            )}
          </div>
        </div>
        <Button onClick={copyLink}>{copied ? "Link copied" : "Copy public link"}</Button>
      </div>
      {shareUrl && (
        <div className="max-w-xl min-w-0 space-y-2">
          <input
            ref={fieldRef}
            readOnly
            value={shareUrl}
            onFocus={(event) => selectField(event.currentTarget)}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 font-mono text-xs text-foreground"
          />
          {hint && <p className="text-sm text-white/60">{hint}</p>}
        </div>
      )}

      <section className="min-w-0">
        <h2 className="text-lg font-medium">For sale</h2>
        {forSale.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">
            Nothing listed. Open a game in Library, turn on For sale, and set an asking price.
          </p>
        ) : (
          <div className="mt-4">
            <GameGrid games={forSale} readOnly publicView showFilters={false} currency={currency} />
          </div>
        )}
      </section>

      {rest.length > 0 && (
        <section className="min-w-0">
          <h2 className="text-lg font-medium">On the shelf</h2>
          <p className="mt-1 text-sm text-white/50">The rest of the collection. Not for sale.</p>
          <div className="mt-4">
            <GameGrid games={rest} readOnly publicView showFilters={false} currency={currency} />
          </div>
        </section>
      )}
    </div>
  );
}
