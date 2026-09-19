"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { artSrc } from "@/lib/art-src";
import { fileToDataUrl } from "@/lib/file";
import { MAX_CONDITION_PHOTOS } from "@/lib/photos";

export function NativeFileButton({
  label,
  onFiles,
  multiple = false,
}: {
  label: string;
  onFiles: (files: File[]) => void;
  multiple?: boolean;
}) {
  return (
    <label className="relative flex h-11 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white/10 text-sm text-white">
      {label}
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}

export function PhotoLightbox({
  photos,
  index,
  title,
  captions,
  onClose,
}: {
  photos: string[];
  index: number;
  title: string;
  captions?: string[];
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  const startX = useRef<number | null>(null);
  const count = photos.length;
  const src = photos[current];
  const caption = captions?.[current];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.preventDefault();
        onClose();
      }
      if (count < 2) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrent((value) => (value + 1) % count);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrent((value) => (value - 1 + count) % count);
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [count, onClose]);

  if (typeof document === "undefined" || !src) return null;

  return createPortal(
    <div
      data-photo-lightbox=""
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photo ${current + 1} of ${count}`}
      className="fixed inset-0 z-[80] flex flex-col bg-black/92"
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          Close
        </button>
        <p className="min-w-0 flex-1 truncate text-sm text-white/70">{title}</p>
        <p className="shrink-0 text-sm text-white/50">
          {current + 1} / {count}
        </p>
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => {
          startX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (startX.current == null || count < 2) return;
          const endX = event.changedTouches[0]?.clientX ?? startX.current;
          const delta = endX - startX.current;
          startX.current = null;
          if (delta > 50) setCurrent((value) => (value - 1 + count) % count);
          if (delta < -50) setCurrent((value) => (value + 1) % count);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artSrc(src)}
          alt={caption || `${title} photo ${current + 1}`}
          className="max-h-full max-w-full object-contain"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 hidden size-11 -translate-y-1/2 rounded-full bg-white/10 text-lg text-white sm:grid sm:place-items-center"
              onClick={() => setCurrent((value) => (value - 1 + count) % count)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              className="absolute right-2 top-1/2 hidden size-11 -translate-y-1/2 rounded-full bg-white/10 text-lg text-white sm:grid sm:place-items-center"
              onClick={() => setCurrent((value) => (value + 1) % count)}
            >
              ›
            </button>
          </>
        )}
      </div>
      {(caption || count > 1) && (
        <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
          {caption ? <p className="text-sm text-white/70">{caption}</p> : null}
          {count > 1 && (
            <div className="mt-3 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Photo ${i + 1}`}
                  className={`size-2 rounded-full ${i === current ? "bg-white" : "bg-white/30"}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setCurrent(i);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}

export function PhotoGallery({
  photos,
  title,
  onChange,
  readOnly = false,
  addLabel = "Add condition photos",
  max = MAX_CONDITION_PHOTOS,
  captions,
}: {
  photos: string[];
  title: string;
  onChange?: (photos: string[]) => void;
  readOnly?: boolean;
  addLabel?: string;
  max?: number;
  captions?: string[];
}) {
  const remaining = Math.max(0, max - photos.length);
  const [openAt, setOpenAt] = useState<number | null>(null);

  async function addFiles(files: File[]) {
    if (!onChange || remaining === 0) return;
    const picked = files.slice(0, remaining);
    const added = await Promise.all(picked.map((file) => fileToDataUrl(file)));
    onChange([...photos, ...added].slice(0, max));
  }

  function removeAt(index: number) {
    if (!onChange) return;
    onChange(photos.filter((_, i) => i !== index));
  }

  if (readOnly && photos.length === 0) return null;

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {photos.map((src, index) => (
            <div
              key={`${src.slice(0, 24)}-${index}`}
              className="relative h-28 w-40 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10"
            >
              <button
                type="button"
                className="block h-full w-full"
                onClick={() => setOpenAt(index)}
                aria-label={`Expand ${title} photo ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artSrc(src)}
                  alt={`${title} photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
              {!readOnly && (
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeAt(index);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {photos.length > 0 && (
        <p className="text-xs text-white/40">Tap a photo to zoom. Swipe or use arrows for the next one.</p>
      )}
      {!readOnly && remaining > 0 && (
        <NativeFileButton
          label={photos.length ? `Add more (${remaining} left)` : addLabel}
          multiple
          onFiles={(files) => void addFiles(files)}
        />
      )}
      {!readOnly && (
        <p className="text-xs text-white/40">
          Up to {max} photos of this copy — back, disc, inserts, wear. Friends can zoom these on the public link.
        </p>
      )}
      {openAt != null && photos[openAt] && (
        <PhotoLightbox
          key={openAt}
          photos={photos}
          index={openAt}
          title={title}
          captions={captions}
          onClose={() => setOpenAt(null)}
        />
      )}
    </div>
  );
}
