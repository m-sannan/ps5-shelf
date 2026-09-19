"use client";

import { useState } from "react";
import { PhotoLightbox } from "@/components/photo-gallery";
import { Button } from "@/components/ui/button";
import { artSrc } from "@/lib/art-src";
import { copyText } from "@/lib/copy-text";
import { money } from "@/lib/format";
import { listingText } from "@/lib/listing";
import { conditionPhotos, listingShots } from "@/lib/photos";
import { CONDITION_LABELS, type CurrencyCode, type Game, type Profile } from "@/lib/types";

export function ListingCard({
  game,
  profile,
  onOpen,
  canCopy = false,
}: {
  game: Game;
  profile: Pick<Profile, "city" | "currency" | "contact">;
  onOpen: () => void;
  canCopy?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [shot, setShot] = useState<number | null>(null);
  const extras = conditionPhotos(game);
  const cover = game.coverImage;
  const side = [game.discPhoto, extras[0], extras[1]].filter(
    (src, index, all): src is string =>
      Boolean(src) && src !== cover && all.indexOf(src) === index,
  );
  const shots = listingShots(game);
  const currency = profile.currency as CurrencyCode;

  async function copyPost() {
    const result = await copyText(listingText(game, profile));
    if (result === "copied") {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  function openShot(src: string) {
    const index = shots.findIndex((item) => item.src === src);
    setShot(index >= 0 ? index : 0);
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-white/4 ring-1 ring-white/10">
      <div className="p-4 sm:p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-amber-300">For sale</p>
        <button type="button" onClick={onOpen} className="mt-1 block w-full text-left">
          <h3 className="text-xl font-medium leading-tight">{game.title}</h3>
        </button>
        <dl className="mt-3 space-y-1 text-sm text-white/70">
          <Row label="Platform" value="PS5" />
          <Row label="Condition" value={CONDITION_LABELS[game.condition]} />
          {game.askingPrice != null && (
            <Row label="Price" value={money(game.askingPrice, currency)} />
          )}
          {profile.city ? <Row label="Location" value={profile.city} /> : null}
        </dl>
        {(cover || side.length > 0) && (
          <Mosaic
            cover={cover}
            side={side}
            title={game.title}
            onOpen={openShot}
          />
        )}
        {game.listingNote?.trim() ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
            {game.listingNote.trim()}
          </p>
        ) : (
          <p className="mt-4 text-sm text-white/40">Tap the title for photos and details.</p>
        )}
      </div>
      {canCopy && (
        <div className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-3 sm:px-5">
          <p className="text-xs text-white/40">Copy as a Discord-style post</p>
          <Button type="button" size="sm" variant="outline" onClick={copyPost}>
            {copied ? "Copied" : "Copy listing"}
          </Button>
        </div>
      )}
      {shot != null && shots.length > 0 && (
        <PhotoLightbox
          key={shot}
          photos={shots.map((item) => item.src)}
          captions={shots.map((item) => item.caption)}
          index={shot}
          title={game.title}
          onClose={() => setShot(null)}
        />
      )}
    </article>
  );
}

function Mosaic({
  cover,
  side,
  title,
  onOpen,
}: {
  cover: string | null;
  side: string[];
  title: string;
  onOpen: (src: string) => void;
}) {
  const hero = cover || side[0];
  const extras = cover ? side : side.slice(1);
  if (!hero) return null;
  if (extras.length === 0) {
    return (
      <div className="mt-4">
        <Shot
          src={hero}
          label={`Expand ${title} photo`}
          className="aspect-[3/4] w-full max-w-xs object-cover"
          onOpen={onOpen}
        />
      </div>
    );
  }
  return (
    <div className="mt-4 grid grid-cols-[1.15fr_0.85fr] gap-1.5">
      <Shot
        src={hero}
        label={`Expand ${title} photo`}
        className="aspect-[3/4] w-full object-cover"
        onOpen={onOpen}
      />
      <div className="grid gap-1.5">
        {extras.slice(0, 2).map((src, index) => (
          <Shot
            key={`${src}-${index}`}
            src={src}
            label={`Expand ${title} photo ${index + 2}`}
            className={
              extras.length === 1
                ? "h-full w-full object-cover"
                : "aspect-square w-full object-cover"
            }
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}

function Shot({
  src,
  label,
  className,
  onOpen,
}: {
  src: string;
  label: string;
  className: string;
  onOpen: (src: string) => void;
}) {
  return (
    <button
      type="button"
      className="relative block h-full overflow-hidden rounded-lg bg-black/40"
      onClick={() => onOpen(src)}
      aria-label={label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={artSrc(src)} alt="" className={className} />
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-white/40">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
