"use client";

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

export function PhotoGallery({
  photos,
  title,
  onChange,
  readOnly = false,
  addLabel = "Add condition photos",
  max = MAX_CONDITION_PHOTOS,
}: {
  photos: string[];
  title: string;
  onChange?: (photos: string[]) => void;
  readOnly?: boolean;
  addLabel?: string;
  max?: number;
}) {
  const remaining = Math.max(0, max - photos.length);

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
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, index) => (
            <div
              key={`${src.slice(0, 24)}-${index}`}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artSrc(src)} alt={`${title} photo ${index + 1}`} className="h-full w-full object-cover" />
              {!readOnly && (
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs text-white"
                  onClick={() => removeAt(index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
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
          Up to {max} photos. They stay on this shelf and are compressed to keep the backup small.
        </p>
      )}
    </div>
  );
}
