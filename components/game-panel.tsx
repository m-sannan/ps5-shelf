"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArtworkPicker } from "@/components/artwork-picker";
import { FieldSelect } from "@/components/field-select";
import { NativeFileButton, PhotoGallery, PhotoLightbox } from "@/components/photo-gallery";
import { RatingStars } from "@/components/rating-stars";
import { ReviewCard, ShareReviewButton } from "@/components/review-card";
import { useLibrary } from "@/components/library-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { artSrc } from "@/lib/art-src";
import { fileToDataUrl } from "@/lib/file";
import { toggleFavoriteId } from "@/lib/crate";
import { isoToday, money, shortDate } from "@/lib/format";
import {
  conditionFields,
  conditionPhotos,
  copyKindPatch,
  isForSale,
  playLane,
  playLabel,
  statusForLane,
} from "@/lib/photos";
import {
  CONDITION_LABELS,
  CONDITIONS,
  COPY_KIND_LABELS,
  COPY_KINDS,
  type Condition,
  type CopyKind,
  type CurrencyCode,
  type Game,
  type Profile,
} from "@/lib/types";

export function GamePanel({
  game,
  onClose,
  emptyHint,
  readOnly = false,
  hideChrome = false,
  publicView = false,
  currency: currencyProp,
  author,
  allowAdd = false,
  shareUrl,
}: {
  game: Game | null;
  onClose: () => void;
  emptyHint: string;
  readOnly?: boolean;
  hideChrome?: boolean;
  publicView?: boolean;
  currency?: CurrencyCode;
  author?: Pick<Profile, "name" | "handle">;
  allowAdd?: boolean;
  shareUrl?: string;
}) {
  const { library, updateGame, deleteGame, updateProfile } = useLibrary();
  const currency = currencyProp ?? library.profile.currency;
  const [coverOpen, setCoverOpen] = useState(false);

  if (!game) {
    return (
      <aside className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-muted-foreground lg:sticky lg:top-8">
        {emptyHint}
      </aside>
    );
  }

  const gameId = game.id;
  const listed = isForSale(game);
  const sold = game.status === "sold";
  const extras = conditionPhotos(game);
  const copyKind = game.copyKind === "digital" ? "digital" : "disc";
  const physical = copyKind === "disc";
  const missingCopyPhotos = listed && physical && extras.length === 0;
  const favoriteIds = library.profile.favoriteIds ?? [];
  const pinned = favoriteIds.includes(game.id);
  const fourFull = favoriteIds.length >= 4 && !pinned;

  const copyPhotos = physical ? (
    <section className="mt-6 min-w-0">
      <h3 className="text-xs font-medium text-sky-300">
        {publicView ? "This copy" : "Condition photos"}
      </h3>
      <p className="mt-1 text-xs text-white/45">
        {publicView
          ? extras.length
            ? "Photos of the disc you would buy. Tap to zoom."
            : "No photos of this copy yet."
          : listed
            ? extras.length
              ? "These photos show on the public link. Tap to zoom."
              : "Friends decide from these. Add the back, the disc, and any wear."
            : "Optional shots of this copy. Separate from box art and the disc face."}
      </p>
      {missingCopyPhotos && !readOnly ? (
        <p className="mt-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          Listed without photos of this copy. A buyer cannot judge a stock cover.
        </p>
      ) : null}
      <div className="mt-3">
        <PhotoGallery
          photos={extras}
          title={game.title}
          readOnly={readOnly}
          onChange={readOnly ? undefined : (next) => updateGame(gameId, conditionFields(next))}
        />
      </div>
    </section>
  ) : null;

  return (
    <aside className={hideChrome ? "min-w-0" : "rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl"}>
      {!hideChrome && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-2xl font-medium leading-tight">{game.title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm text-white/55">
        <Badge className={listed ? "bg-amber-400 text-black" : "bg-white/10 text-white"}>
          {sold ? "Sold" : listed ? "For sale" : playLabel(game.status)}
        </Badge>
        {physical ? <span>{CONDITION_LABELS[game.condition]}</span> : null}
        <span>· {COPY_KIND_LABELS[copyKind]}</span>
        {!publicView && game.borrowedFrom ? <span>· from {game.borrowedFrom}</span> : null}
        {!publicView && game.purchaseDate ? (
          <span>· bought {shortDate(game.purchaseDate)}</span>
        ) : null}
      </div>

      {publicView && listed && game.askingPrice != null && (
        <p className="mt-4 text-2xl font-medium">
          {money(game.askingPrice, currency)}
          <span className="ml-2 text-sm font-normal text-white/50">asking</span>
        </p>
      )}

      {publicView && listed && game.listingNote?.trim() ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
          {game.listingNote.trim()}
        </p>
      ) : null}

      {publicView && listed ? copyPhotos : null}

      {publicView ? (
        <div className="mt-4 space-y-3">
          {allowAdd ? <AddToShelfButton game={game} /> : null}
          {(game.review?.trim() || game.rating) && author ? (
            <ReviewCard
              game={game}
              profile={author}
              url={shareUrl}
              shareable
            />
          ) : game.rating ? (
            <div>
              <p className="mb-1 text-xs font-medium text-white/50">Rating</p>
              <RatingStars value={game.rating} readOnly size="sm" />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4">
          <p className="mb-1 text-xs font-medium text-white/50">Your rating</p>
          <RatingStars
            value={game.rating}
            readOnly={readOnly}
            onChange={readOnly ? undefined : (value) => updateGame(gameId, { rating: value })}
          />
        </div>
      )}

      {!readOnly && !publicView && (
        <section className="mt-5">
          <Label htmlFor={`review-${gameId}`}>Public take</Label>
          <p className="mt-1 text-xs text-white/45">
            Friends see this on your Crate. Private notes stay below. Share it like a
            Letterboxd review.
          </p>
          {readOnly ? (
            <p className="mt-1.5 text-sm text-white/70">{game.review?.trim() || "No take yet."}</p>
          ) : (
            <Textarea
              id={`review-${gameId}`}
              className="mt-1.5 min-h-24"
              value={game.review ?? ""}
              placeholder="at one point this game…"
              onChange={(event) => {
                const review = event.target.value;
                updateGame(gameId, {
                  review,
                  loggedAt: review.trim() ? game.loggedAt || isoToday() : "",
                });
              }}
            />
          )}
          {game.review?.trim() ? (
            <ShareReviewButton
              game={game}
              profile={author ?? library.profile}
              url={shareUrl}
            />
          ) : null}
        </section>
      )}

      {!readOnly && !publicView && (
        <button
          type="button"
          disabled={fourFull}
          onClick={() => {
            const next = toggleFavoriteId(favoriteIds, gameId);
            if (next.full) return;
            updateProfile({ ...library.profile, favoriteIds: next.ids });
          }}
          className={`mt-4 w-full rounded-xl px-3 py-2.5 text-left text-sm ring-1 ${
            pinned
              ? "bg-white/8 text-white ring-white/15"
              : "text-white/70 ring-white/10 hover:text-white"
          } disabled:opacity-40`}
        >
          <span className="block font-medium">
            {pinned ? "Pinned as a favourite" : fourFull ? "Favourites are full" : "Pin as a favourite"}
          </span>
          <span className="block text-xs text-white/45">
            {pinned
              ? "Shows in the four on your public Crate. Tap to unpin."
              : fourFull
                ? "Unpin one from Share, then pin this."
                : "One of the four cases people see first."}
          </span>
        </button>
      )}

      {!readOnly && !sold && (
        <section className="mt-5">
          <p className="mb-2 text-xs font-medium text-white/50">Stack</p>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1">
            {(
              [
                ["shelf", "Shelf"],
                ["playing", "Playing"],
                ["done", "Done"],
              ] as const
            ).map(([id, label]) => {
              const active = playLane(game.status) === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`rounded-md px-2 py-2 text-sm ${
                    active ? "bg-[#2f2f32] text-white" : "text-white/45 hover:text-white"
                  }`}
                  onClick={() =>
                    updateGame(gameId, {
                      status: statusForLane(id, game.status),
                    })
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-white/40">
            Playing is your current stack. Done is finished. Shelf is everything else.
          </p>
        </section>
      )}

      {!publicView && (
        <section className="mt-5">
          <Label htmlFor={`notes-${gameId}`}>Notes</Label>
          <p className="mt-1 text-xs text-white/45">
            Private reminder for you — steelbook, missing insert, pickup in Noida.
            Friends never see this.
          </p>
          {readOnly ? (
            <p className="mt-1.5 text-sm text-white/70">{game.notes || "No notes."}</p>
          ) : (
            <Textarea
              id={`notes-${gameId}`}
              className="mt-1.5 min-h-20"
              value={game.notes}
              placeholder="Anything you’ll want later about this copy"
              onChange={(event) => updateGame(gameId, { notes: event.target.value })}
            />
          )}
        </section>
      )}

      {!readOnly && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <FieldSelect
            id={`kind-${gameId}`}
            label="Copy"
            value={copyKind}
            onChange={(value) =>
              updateGame(gameId, copyKindPatch(value as CopyKind, game.status))
            }
            options={COPY_KINDS.map((item) => ({
              value: item,
              label: COPY_KIND_LABELS[item],
            }))}
          />
          {physical ? (
            <FieldSelect
              id={`cond-${gameId}`}
              label="Condition"
              value={game.condition}
              onChange={(value) => updateGame(gameId, { condition: value as Condition })}
              options={CONDITIONS.map((item) => ({
                value: item,
                label: CONDITION_LABELS[item],
              }))}
            />
          ) : (
            <p className="self-end text-xs text-white/45">
              Digital copies live on your account. No disc condition, and they can’t be listed or sold.
            </p>
          )}
        </div>
      )}

      {!readOnly && physical && (
        <section className="mt-5 space-y-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">For sale</span>
              <span className="block text-xs text-white/50">
                Public link shows asking price, condition, and photos of this copy.
              </span>
            </span>
            <input
              type="checkbox"
              className="size-4 shrink-0"
              checked={listed}
              disabled={sold}
              onChange={(event) => {
                if (event.target.checked) {
                  updateGame(gameId, {
                    askingPrice: game.askingPrice ?? game.purchasePrice ?? 0,
                    status: game.status === "sold" ? "on_shelf" : game.status === "for_sale" ? "on_shelf" : game.status,
                  });
                } else {
                  updateGame(gameId, {
                    askingPrice: null,
                    status: game.status === "for_sale" ? "on_shelf" : game.status,
                  });
                }
              }}
            />
          </label>
          {listed && !sold && (
            <>
            <div className="grid gap-1.5">
              <Label htmlFor={`ask-${gameId}`}>Asking price</Label>
              <Input
                id={`ask-${gameId}`}
                type="number"
                min="0"
                step="1"
                value={game.askingPrice ?? ""}
                onChange={(event) => {
                  const next = event.target.value;
                  updateGame(gameId, {
                    askingPrice: next === "" ? 0 : Number(next),
                  });
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`listing-${gameId}`}>What friends read</Label>
              <p className="text-xs text-white/50">
                This is the listing text — PS5 vs PS4, complete in box, pickup only. Not your private notes.
              </p>
              <Textarea
                id={`listing-${gameId}`}
                value={game.listingNote ?? ""}
                placeholder="PS5 disc. Complete. Pickup in my city."
                onChange={(event) => updateGame(gameId, { listingNote: event.target.value })}
              />
            </div>
            </>
          )}
        </section>
      )}

      {!readOnly && physical && (
        <section className="mt-3 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">Sold</span>
              <span className="block text-xs text-white/50">Hides this copy from the public link.</span>
            </span>
            <input
              type="checkbox"
              className="size-4 shrink-0"
              checked={sold}
              onChange={(event) => {
                if (event.target.checked) {
                  updateGame(gameId, {
                    status: "sold",
                    soldPrice: game.soldPrice ?? game.askingPrice ?? game.purchasePrice ?? 0,
                    askingPrice: null,
                  });
                } else {
                  updateGame(gameId, { status: "on_shelf", soldPrice: null });
                }
              }}
            />
          </label>
          {sold && (
            <div className="grid gap-1.5">
              <Label htmlFor={`sold-${gameId}`}>Sold for</Label>
              <Input
                id={`sold-${gameId}`}
                type="number"
                min="0"
                step="1"
                value={game.soldPrice ?? ""}
                onChange={(event) =>
                  updateGame(gameId, {
                    soldPrice: event.target.value === "" ? null : Number(event.target.value),
                    status: "sold",
                  })
                }
              />
            </div>
          )}
        </section>
      )}

      {!publicView && (
        <label className="mt-5 flex items-center justify-between gap-3 text-sm">
          <span>
            <span className="block font-medium">Show on public link</span>
            <span className="block text-xs text-white/50">
              Off hides this copy from Share, even if it is listed.
            </span>
          </span>
          <input
            type="checkbox"
            className="size-4 shrink-0"
            checked={game.hidden !== true}
            disabled={readOnly}
            onChange={(event) => updateGame(gameId, { hidden: !event.target.checked })}
          />
        </label>
      )}

      {!publicView && physical && (
        <div className="mt-4 grid gap-1.5">
          <Label htmlFor={`borrowed-${gameId}`}>Borrowed from</Label>
          <p className="text-xs text-white/45">
            Whose disc this is. Private — friends never see this.
          </p>
          <Input
            id={`borrowed-${gameId}`}
            value={game.borrowedFrom ?? ""}
            disabled={readOnly}
            placeholder="e.g. Musa"
            onChange={(event) => updateGame(gameId, { borrowedFrom: event.target.value })}
          />
        </div>
      )}

      {!publicView && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor={`paid-${gameId}`}>What you paid</Label>
            <p className="text-xs text-white/45">Enter 0 if it was a gift.</p>
            <Input
              id={`paid-${gameId}`}
              type="number"
              min="0"
              step="1"
              value={game.purchasePrice || ""}
              disabled={readOnly}
              onChange={(event) =>
                updateGame(gameId, { purchasePrice: Number(event.target.value) || 0 })
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`bought-${gameId}`}>Purchased</Label>
            <p className="text-xs text-white/45">Leave blank if you don’t remember.</p>
            <div className="flex items-center gap-2">
              <Input
                id={`bought-${gameId}`}
                type="date"
                value={game.purchaseDate || ""}
                disabled={readOnly}
                onChange={(event) => updateGame(gameId, { purchaseDate: event.target.value })}
              />
              {!readOnly && game.purchaseDate ? (
                <button
                  type="button"
                  className="shrink-0 text-xs text-white/45 hover:text-white"
                  onClick={() => updateGame(gameId, { purchaseDate: "" })}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {(!publicView || !listed) && (
        <section className="mt-6 min-w-0">
          <h3 className="text-xs font-medium text-sky-300">Box art</h3>
          {game.coverImage && (
            <button
              type="button"
              className="mt-3 block"
              onClick={() => setCoverOpen(true)}
              aria-label={`Expand ${game.title} box art`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artSrc(game.coverImage)}
                alt={`${game.title} box art`}
                className="h-40 w-28 rounded-md object-cover ring-1 ring-white/10"
              />
            </button>
          )}
          {!readOnly && (
            <div className="mt-3 min-w-0 space-y-2">
              <ArtworkPicker
                title={game.title}
                current={game.coverImage}
                onPick={(url) => updateGame(gameId, { coverImage: url })}
              />
              <NativeFileButton
                label="Upload box art"
                onFiles={async (files) => {
                  const file = files[0];
                  if (file) updateGame(gameId, { coverImage: await fileToDataUrl(file) });
                }}
              />
            </div>
          )}
        </section>
      )}

      {!(publicView && listed) ? copyPhotos : null}

      {!readOnly && (
        <Button
          className="mt-6 w-full"
          variant="destructive"
          onClick={() => {
            deleteGame(gameId);
            onClose();
          }}
        >
          Remove from shelf
        </Button>
      )}

      {coverOpen && game.coverImage && (
        <PhotoLightbox
          key={game.coverImage}
          photos={[game.coverImage]}
          index={0}
          title={game.title}
          captions={["Box art"]}
          onClose={() => setCoverOpen(false)}
        />
      )}
    </aside>
  );
}

function AddToShelfButton({ game }: { game: Game }) {
  const { addFromPublic, library, signedIn } = useLibrary();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "added" | "exists" | "no-shelf">("idle");
  const already = library.games.some(
    (row) => row.title.trim().toLowerCase() === game.title.trim().toLowerCase(),
  );

  if (already || state === "exists") {
    return <p className="text-sm text-white/50">Already on your shelf.</p>;
  }
  if (state === "added") {
    return <p className="text-sm text-emerald-300/90">Added to your shelf.</p>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        onClick={() => {
          const result = addFromPublic(game);
          setState(result);
          if (result === "no-shelf") router.push("/");
        }}
      >
        Add to my shelf
      </Button>
      <p className="text-xs text-white/40">
        {signedIn
          ? "Copies the title and box art. Rating, notes, and price stay theirs."
          : "Opens Crate so you can keep this disc."}
      </p>
    </div>
  );
}
