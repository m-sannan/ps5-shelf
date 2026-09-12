"use client";

import { useState } from "react";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { fileToDataUrl } from "@/lib/file";
import {
  CONDITION_LABELS,
  CONDITIONS,
  PLAY_STATUSES,
  STATUS_LABELS,
  type Condition,
  type PlayStatus,
} from "@/lib/types";

const COLORS = [
  "#3b82f6",
  "#dc2626",
  "#7c3aed",
  "#059669",
  "#eab308",
  "#ec4899",
  "#0ea5e9",
  "#b45309",
];

export function AddGameSheet() {
  const { addGame } = useLibrary();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState<PlayStatus>("on_shelf");
  const [condition, setCondition] = useState<Condition>("near_mint");
  const [notes, setNotes] = useState("");
  const [coverColor, setCoverColor] = useState(COLORS[0]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [discPhoto, setDiscPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");

  function reset() {
    setTitle("");
    setPurchasePrice("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setStatus("on_shelf");
    setCondition("near_mint");
    setNotes("");
    setCoverColor(COLORS[0]);
    setCoverImage(null);
    setDiscPhoto(null);
    setError("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Give the disc a title.");
      return;
    }
    addGame({
      title: title.trim(),
      purchasePrice: Number(purchasePrice) || 0,
      purchaseDate,
      askingPrice: null,
      soldPrice: null,
      status,
      condition,
      notes: notes.trim(),
      coverColor,
      coverImage,
      discPhoto,
    });
    reset();
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Add a game</Button>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add a PS5 game</SheetTitle>
          <SheetDescription>
            Put a case on the rail with what you paid and how far you got.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} className="grid gap-3 px-4 pb-6">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Astro Bot"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="price">What you paid</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(event) => setPurchasePrice(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bought">Purchase date</Label>
              <Input
                id="bought"
                type="date"
                value={purchaseDate}
                onChange={(event) => setPurchaseDate(event.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="new-status">Status</Label>
              <select
                id="new-status"
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
                value={status}
                onChange={(event) => setStatus(event.target.value as PlayStatus)}
              >
                {PLAY_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {STATUS_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-condition">Condition</Label>
              <select
                id="new-condition"
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
                value={condition}
                onChange={(event) =>
                  setCondition(event.target.value as Condition)
                }
              >
                {CONDITIONS.map((item) => (
                  <option key={item} value={item}>
                    {CONDITION_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Label color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCoverColor(color)}
                  className="size-7 rounded-full border"
                  style={{
                    background: color,
                    outline:
                      coverColor === color ? "2px solid white" : undefined,
                  }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cover">Box art photo</Label>
            <Input
              id="cover"
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) setCoverImage(await fileToDataUrl(file));
              }}
            />
            <Input
              placeholder="Or paste an image link"
              onBlur={(event) => {
                if (event.target.value.trim()) {
                  setCoverImage(event.target.value.trim());
                }
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="disc">Real disc photo</Label>
            <Input
              id="disc"
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) setDiscPhoto(await fileToDataUrl(file));
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Steelbook, insert missing, finished but still replaying…"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit">Put it on the rail</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
