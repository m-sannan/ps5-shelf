"use client";

import { useState } from "react";
import { ArtworkPicker } from "@/components/artwork-picker";
import { FieldSelect } from "@/components/field-select";
import { NativeFileButton, PhotoGallery, PhotoLightbox } from "@/components/photo-gallery";
import { RatingStars } from "@/components/rating-stars";
import { useLibrary } from "@/components/library-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { artSrc } from "@/lib/art-src";
import { fileToDataUrl } from "@/lib/file";
import { money, shortDate } from "@/lib/format";
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
  type Game,
} from "@/lib/types";

export function GamePanel({
  game,
  onClose,
  emptyHint,
  readOnly = false,
  hideChrome = false,
  publicView = false,
}: {
  game: Game | null;
  onClose: () => void;
  emptyHint: string;
  readOnly?: boolean;
  hideChrome?: boolean;
  publicView?: boolean;
}) {
  const { library, updateGame, deleteGame } = useLibrary();
  const currency = library.profile.currency;
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

      {publicView && listed ? copyPhotos : null}

      <div className="mt-4">
        <p className="mb-1 text-xs font-medium text-white/50">{publicView ? "Rating" : "Your rating"}</p>
        <RatingStars
          value={game.rating}
          readOnly={readOnly}
          onChange={readOnly ? undefined : (value) => updateGame(gameId, { rating: value })}
        />
      </div>

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
