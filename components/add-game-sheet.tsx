"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { ArtworkPicker } from "@/components/artwork-picker";
import { FieldSelect } from "@/components/field-select";
import { NativeFileButton, PhotoGallery } from "@/components/photo-gallery";
import { RatingStars } from "@/components/rating-stars";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { artSrc } from "@/lib/art-src";
import { fileToDataUrl } from "@/lib/file";
import { conditionFields } from "@/lib/photos";
import { POPULAR_PS5 } from "@/lib/popular";
import {
  CONDITION_LABELS,
  CONDITIONS,
  COPY_KIND_LABELS,
  COPY_KINDS,
  type Condition,
  type CopyKind,
} from "@/lib/types";

type PopularHit = { title: string; cover: string | null };

export function AddGameSheet({ variant = "header" }: { variant?: "header" | "fab" }) {
  const { addGame, library } = useLibrary();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [discPhoto, setDiscPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [borrowedFrom, setBorrowedFrom] = useState("");
  const [listForSale, setListForSale] = useState(false);
  const [askingPrice, setAskingPrice] = useState("");
  const [listingNote, setListingNote] = useState("");
  const [condition, setCondition] = useState<Condition>("near_mint");
  const [copyKind, setCopyKind] = useState<CopyKind>("disc");
  const [rating, setRating] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [popular, setPopular] = useState<PopularHit[]>(
    POPULAR_PS5.map((item) => ({ title: item, cover: null })),
  );
  const physical = copyKind === "disc";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all(
      POPULAR_PS5.map(async (item) => {
        try {
          const response = await fetch(`/api/covers?q=${encodeURIComponent(item)}`);
          const data = (await response.json()) as { covers?: { url: string }[] };
          return { title: item, cover: data.covers?.[0]?.url ?? null };
        } catch {
          return { title: item, cover: null };
        }
      }),
    ).then((hits) => {
      if (!cancelled) setPopular(hits);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function reset() {
    setTitle("");
    setCoverImage(null);
    setPhotos([]);
    setDiscPhoto(null);
    setNotes("");
    setPurchasePrice("");
    setPurchaseDate("");
    setBorrowedFrom("");
    setListForSale(false);
    setAskingPrice("");
    setListingNote("");
    setCondition("near_mint");
    setCopyKind("disc");
    setRating(null);
    setError("");
  }

  function pickPopular(hit: PopularHit) {
    setTitle(hit.title);
    if (hit.cover) setCoverImage(hit.cover);
    setError("");
  }

  function save(titleValue: string, art: string | null) {
    const listed = physical && listForSale;
    addGame({
      title: titleValue,
      purchasePrice: Number(purchasePrice) || 0,
      purchaseDate: purchaseDate.trim(),
      askingPrice: listed ? Number(askingPrice) || 0 : null,
      soldPrice: null,
      status: listed ? "for_sale" : "on_shelf",
      condition,
      copyKind,
      rating,
      borrowedFrom: physical ? borrowedFrom.trim() : "",
      listingNote: listed ? listingNote.trim() : "",
      hidden: false,
      notes: notes.trim(),
      coverColor: "#3b82f6",
      coverImage: art,
      discPhoto: physical ? discPhoto : null,
      casePhoto: null,
      ...conditionFields(physical ? photos : []),
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Give the game a title.");
      return;
    }
    let art = coverImage;
    if (!art) {
      try {
        const response = await fetch(`/api/covers?q=${encodeURIComponent(title.trim())}`);
        const data = (await response.json()) as { covers?: { url: string }[] };
        art = data.covers?.[0]?.url ?? null;
      } catch {
        art = null;
      }
    }
    save(title.trim(), art);
    reset();
    setOpen(false);
  }

  const owned = new Set(library.games.map((game) => game.title.toLowerCase()));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {variant === "fab" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute bottom-[4.75rem] right-4 z-40 flex size-14 items-center justify-center rounded-full bg-white text-black shadow-lg sm:hidden"
          aria-label="Add a game"
        >
          <Plus className="size-6" />
        </button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} size="sm" className="hidden sm:inline-flex">
          Add a game
        </Button>
      )}
      <SheetContent
        side="right"
        className="h-dvh w-full max-w-full gap-0 overflow-hidden p-0 sm:inset-y-5 sm:right-5 sm:left-auto sm:h-auto sm:w-[min(32rem,calc(100vw-2.5rem))] sm:max-w-none sm:rounded-[22px] sm:border sm:border-white/10 data-[side=right]:w-full sm:data-[side=right]:w-[min(32rem,calc(100vw-2.5rem))]"
      >
        <form onSubmit={onSubmit} className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <SheetHeader className="shrink-0 space-y-1 pr-12">
            <SheetTitle>Add a PS5 game</SheetTitle>
            <SheetDescription>
              Pick a title, find box art, then add it. Photos of your copy are optional.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-4">
            <div className="min-w-0 space-y-5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/50">Popular right now</p>
                <div className="mt-2 flex min-w-0 gap-2.5 overflow-x-auto pb-1">
                  {popular.map((hit) => {
                    const have = owned.has(hit.title.toLowerCase());
                    const selected = title === hit.title;
                    return (
                      <button
                        key={hit.title}
                        type="button"
                        onClick={() => pickPopular(hit)}
                        className={`w-20 shrink-0 overflow-hidden rounded-lg text-left ring-1 transition sm:w-24 ${
                          selected ? "ring-white" : "ring-white/12 hover:ring-white/40"
                        } ${have ? "opacity-50" : ""}`}
                        title={have ? `Already on the shelf: ${hit.title}` : hit.title}
                      >
                        <span className="block aspect-[3/4] bg-[#0e0e10]">
                          {hit.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={artSrc(hit.cover)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full items-end p-1.5 text-[10px] leading-tight text-white/80">
                              {hit.title}
                            </span>
                          )}
                        </span>
                        <span className="block truncate px-1 py-1 text-[10px] leading-tight text-white/70">
                          {hit.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Astro Bot"
                />
              </div>

              <FieldSelect
                id="new-kind"
                label="Copy"
                value={copyKind}
                onChange={(value) => {
                  const next = value as CopyKind;
                  setCopyKind(next);
                  if (next === "digital") setListForSale(false);
                }}
                options={COPY_KINDS.map((item) => ({
                  value: item,
                  label: COPY_KIND_LABELS[item],
                }))}
              />
              {!physical && (
                <p className="-mt-3 text-xs text-white/45">
                  Digital copies live on your account. No disc condition, and they can’t be listed or sold.
                </p>
              )}

              <section className="min-w-0 space-y-3">
                <h3 className="text-xs font-medium text-sky-300">Box art</h3>
                {coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artSrc(coverImage)}
                    alt="Selected box art"
                    className="h-40 w-28 max-w-full rounded-md object-cover"
                  />
                )}
                <ArtworkPicker title={title} current={coverImage} onPick={setCoverImage} />
                <NativeFileButton
                  label="Upload box art"
                  onFiles={async (files) => {
                    const file = files[0];
                    if (file) setCoverImage(await fileToDataUrl(file));
                  }}
                />
              </section>

              {physical && (
                <section className="min-w-0 space-y-2">
                  <h3 className="text-xs font-medium text-sky-300">Disc photo</h3>
                  <p className="text-xs text-white/45">
                    The circular disc on the shelf. Separate from box art.
                  </p>
                  {discPhoto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artSrc(discPhoto)}
                      alt="Disc"
                      className="size-28 rounded-full object-cover"
                    />
                  )}
                  <NativeFileButton
                    label={discPhoto ? "Replace disc photo" : "Upload disc photo"}
                    onFiles={async (files) => {
                      const file = files[0];
                      if (file) setDiscPhoto(await fileToDataUrl(file));
                    }}
                  />
                </section>
              )}

              {physical && (
                <section className="min-w-0 space-y-2">
                  <h3 className="text-xs font-medium text-sky-300">Condition photos</h3>
                  <p className="text-xs text-white/45">
                    Optional. Up to 5 shots of this copy — not box art, not the disc face.
                  </p>
                  <PhotoGallery photos={photos} title={title} onChange={setPhotos} />
                </section>
              )}

              <div className="min-w-0 space-y-1.5">
                <p className="text-sm font-medium">Your rating</p>
                <RatingStars value={rating} onChange={setRating} />
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <p className="text-xs text-white/45">
                  Private reminder for you — steelbook, missing insert, pickup notes.
                  Friends never see this.
                </p>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Anything you’ll want later about this copy"
                />
              </div>

              {physical && (
                <div className="grid min-w-0 gap-1.5">
                  <Label htmlFor="borrowed">Borrowed from</Label>
                  <p className="text-xs text-white/45">
                    Leave blank if you own this disc. Whose copy it is stays private.
                  </p>
                  <Input
                    id="borrowed"
                    value={borrowedFrom}
                    onChange={(event) => setBorrowedFrom(event.target.value)}
                    placeholder="e.g. Musa"
                  />
                </div>
              )}

              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="price">What you paid</Label>
                  <p className="text-xs text-white/45">Optional. 0 if it was a gift.</p>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1"
                    value={purchasePrice}
                    onChange={(event) => setPurchasePrice(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="bought">Purchased</Label>
                  <p className="text-xs text-white/45">Leave blank if you don’t remember.</p>
                  <Input
                    id="bought"
                    type="date"
                    value={purchaseDate}
                    onChange={(event) => setPurchaseDate(event.target.value)}
                  />
                </div>
              </div>

              {physical && (
                <FieldSelect
                  id="new-condition"
                  label="Condition"
                  value={condition}
                  onChange={(value) => setCondition(value as Condition)}
                  options={CONDITIONS.map((item) => ({
                    value: item,
                    label: CONDITION_LABELS[item],
                  }))}
                />
              )}

              {physical && (
                <section className="min-w-0 space-y-3 rounded-xl border border-amber-400/25 bg-amber-400/5 p-4">
                  <label className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      <span className="block font-medium">List for sale</span>
                      <span className="block text-xs text-white/50">
                        Friends will see the asking price on your public link.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      className="size-4 shrink-0"
                      checked={listForSale}
                      onChange={(event) => setListForSale(event.target.checked)}
                    />
                  </label>
                  {listForSale && (
                    <>
                    <div className="grid gap-1.5">
                      <Label htmlFor="ask">Asking price</Label>
                      <Input
                        id="ask"
                        type="number"
                        min="0"
                        step="1"
                        value={askingPrice}
                        onChange={(event) => setAskingPrice(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="listing-note">What friends read</Label>
                      <p className="text-xs text-white/50">
                        PS5 disc not PS4, complete in box, pickup only — this shows on the public listing.
                      </p>
                      <Textarea
                        id="listing-note"
                        value={listingNote}
                        onChange={(event) => setListingNote(event.target.value)}
                        placeholder="PS5 version. Complete. Pickup in my city."
                      />
                    </div>
                    </>
                  )}
                </section>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 p-4">
            <Button type="submit" className="w-full">
              Add to library
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
