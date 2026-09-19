"use client";

import { useMemo, useRef, useState } from "react";
import { ShareGuideButton } from "@/components/app-frame";
import { CrateView } from "@/components/crate-view";
import { FieldSelect } from "@/components/field-select";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { artSrc } from "@/lib/art-src";
import { publicShelfPath } from "@/lib/cloud/client";
import { copyText, selectField } from "@/lib/copy-text";
import { handleError, normalizeHandle } from "@/lib/handle";
import { toggleFavoriteId } from "@/lib/crate";
import { toPublicLibrary } from "@/lib/public-view";
import { CURRENCIES, type CurrencyCode, type Game } from "@/lib/types";

export function ShareLibrary() {
  const { library, ready, cloud, syncError, updateProfile, updateGame } = useLibrary();
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState("");
  const [handleDraft, setHandleDraft] = useState(library.profile.handle ?? "");
  const [handleFocused, setHandleFocused] = useState(false);
  const [picking, setPicking] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);
  const publicOn = library.profile.sharePublic !== false;
  const showCollection = library.profile.shareCollection !== false;
  const preview = useMemo(() => toPublicLibrary(library), [library]);
  const hidden = library.games.filter((game) => game.hidden);
  const favoriteIds = library.profile.favoriteIds ?? [];
  const shareUrl =
    typeof window !== "undefined" && cloud?.publicId
      ? `${window.location.origin}${publicShelfPath(cloud.publicId, library.profile.handle)}`
      : cloud?.publicId
        ? publicShelfPath(cloud.publicId, library.profile.handle)
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

  function commitHandle() {
    const next = normalizeHandle(handleDraft);
    if (!next) {
      updateProfile({ ...library.profile, handle: "" });
      setHint("");
      return;
    }
    const problem = handleError(next);
    if (problem) {
      setHint(problem);
      return;
    }
    updateProfile({ ...library.profile, handle: next });
    setHandleDraft(next);
    setHint("");
  }

  function setFavorites(ids: string[]) {
    updateProfile({ ...library.profile, favoriteIds: ids });
  }

  if (!ready) {
    return <p className="text-sm text-white/50">Opening the library…</p>;
  }

  return (
    <div className="min-w-0 space-y-8">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Share</p>
          <h1 className="mt-1 text-2xl font-medium">Your public Crate</h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Library stays private. This is the page people remember — four favourites,
            what you are playing, then the shelf. Listings sit at the bottom if you
            want them. Pin four, pick a handle, download the card.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ShareGuideButton />
          <Button onClick={copyLink}>{copied ? "Link copied" : "Copy public link"}</Button>
        </div>
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

      <section className="rounded-2xl bg-white/4 p-5 ring-1 ring-white/8">
        <p className="font-medium">Public page</p>
        <p className="mt-1 text-sm text-white/50">
          These switches change what friends see on the link. They do not change your Library.
        </p>
        <div className="mt-4 space-y-3">
          <Toggle
            label="Public link"
            hint="Off: the link says this Crate is private."
            checked={publicOn}
            onChange={(checked) => updateProfile({ ...library.profile, sharePublic: checked })}
          />
          <Toggle
            label="Show my collection"
            hint="On is the brag shelf. Off shows only copies for sale."
            checked={showCollection}
            disabled={!publicOn}
            onChange={(checked) => updateProfile({ ...library.profile, shareCollection: checked })}
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input
              value={library.profile.name}
              onChange={(event) =>
                updateProfile({ ...library.profile, name: event.target.value })
              }
            />
          </Field>
          <Field label="Handle">
            <Input
              value={handleFocused ? handleDraft : (library.profile.handle ?? "")}
              placeholder="sannan"
              onFocus={() => {
                setHandleDraft(library.profile.handle ?? "");
                setHandleFocused(true);
              }}
              onChange={(event) => setHandleDraft(event.target.value)}
              onBlur={() => {
                setHandleFocused(false);
                commitHandle();
              }}
            />
            <p className="mt-1 text-xs text-white/40">
              Turns the link into /s/yourname. Letters, numbers, hyphen. Old links still work.
            </p>
            {syncError ? <p className="mt-1 text-xs text-destructive">{syncError}</p> : null}
          </Field>
          <Field label="City">
            <Input
              value={library.profile.city}
              onChange={(event) =>
                updateProfile({ ...library.profile, city: event.target.value })
              }
            />
          </Field>
          <FieldSelect
            id="currency"
            label="Currency"
            value={library.profile.currency}
            onChange={(value) =>
              updateProfile({
                ...library.profile,
                currency: value as CurrencyCode,
              })
            }
            options={CURRENCIES.map((item) => ({
              value: item.code,
              label: `${item.code} — ${item.label}`,
            }))}
          />
          <Field label="Contact">
            <Input
              value={library.profile.contact}
              onChange={(event) =>
                updateProfile({ ...library.profile, contact: event.target.value })
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Share note">
              <Textarea
                value={library.profile.note}
                onChange={(event) =>
                  updateProfile({ ...library.profile, note: event.target.value })
                }
                placeholder="Physical copies. Local pickup."
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white/4 p-5 ring-1 ring-white/8">
        <p className="font-medium">Four favourites</p>
        <p className="mt-1 text-sm text-white/50">
          The first thing people see. Like Letterboxd four posters. Empty slots fall back to
          your highest rated games.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((slot) => {
            const id = favoriteIds[slot];
            const game = id ? library.games.find((row) => row.id === id) : null;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  if (game) {
                    setFavorites(favoriteIds.filter((fav) => fav !== game.id));
                    return;
                  }
                  setPicking(true);
                }}
                className="min-w-0 text-left"
              >
                <span className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-black/30 ring-1 ring-dashed ring-white/15">
                  {game?.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artSrc(game.coverImage)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-white/40">
                      {game ? game.title : "Pick a game"}
                    </span>
                  )}
                </span>
                <span className="mt-2 block truncate text-xs text-white/55">
                  {game ? "Tap to unpin" : `Slot ${slot + 1}`}
                </span>
              </button>
            );
          })}
        </div>
        {picking ? (
          <FavoritePickList
            games={library.games.filter((game) => game.status !== "sold" && !game.hidden)}
            selected={favoriteIds}
            onPick={(game) => {
              const next = toggleFavoriteId(favoriteIds, game.id);
              if (next.full) {
                setHint("Four already pinned. Unpin one first.");
                return;
              }
              setFavorites(next.ids);
              setPicking(false);
              setHint("");
            }}
            onClose={() => setPicking(false)}
          />
        ) : null}
      </section>

      {hidden.length > 0 && (
        <section className="rounded-2xl bg-white/4 p-5 ring-1 ring-white/8">
          <p className="font-medium">Hidden from the link</p>
          <p className="mt-1 text-sm text-white/50">Still in your Library. Friends cannot see them.</p>
          <ul className="mt-3 space-y-2">
            {hidden.map((game) => (
              <li key={game.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{game.title}</span>
                <button
                  type="button"
                  className="shrink-0 text-white/50 hover:text-white"
                  onClick={() => updateGame(game.id, { hidden: false })}
                >
                  Show
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Preview</p>
        <h2 className="mt-1 text-xl font-medium">What they see</h2>
        {!publicOn ? (
          <p className="mt-4 rounded-2xl bg-white/4 px-4 py-8 text-center text-sm text-white/55 ring-1 ring-white/8">
            The public link currently says this Crate is private.
          </p>
        ) : (
          <div className="mt-6">
            <CrateView
              profile={preview.profile}
              games={preview.games}
              publicId={cloud?.publicId}
              copyListing
              showCard
              isOwner
            />
          </div>
        )}
      </section>
    </div>
  );
}

function FavoritePickList({
  games,
  selected,
  onPick,
  onClose,
}: {
  games: Game[];
  selected: string[];
  onPick: (game: Game) => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">Pick a game</p>
        <button type="button" className="text-sm text-white/50 hover:text-white" onClick={onClose}>
          Close
        </button>
      </div>
      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {games.map((game) => (
          <li key={game.id}>
            <button
              type="button"
              disabled={selected.includes(game.id)}
              onClick={() => onPick(game)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5 disabled:opacity-40"
            >
              <span className="size-10 shrink-0 overflow-hidden rounded bg-white/10">
                {game.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={artSrc(game.coverImage)} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span className="truncate">{game.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex items-center justify-between gap-3 text-sm ${disabled ? "opacity-40" : ""}`}>
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-white/50">{hint}</span>
      </span>
      <input
        type="checkbox"
        className="size-4 shrink-0"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-white/45">{label}</Label>
      {children}
    </div>
  );
}
