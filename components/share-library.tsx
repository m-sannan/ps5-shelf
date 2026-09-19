"use client";

import { useMemo, useRef, useState } from "react";
import { ShareGuideButton } from "@/components/app-frame";
import { FieldSelect } from "@/components/field-select";
import { GameGrid } from "@/components/game-grid";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { publicShelfPath } from "@/lib/cloud/client";
import { copyText, selectField } from "@/lib/copy-text";
import { money } from "@/lib/format";
import { isForSale } from "@/lib/photos";
import { toPublicLibrary } from "@/lib/public-view";
import { CURRENCIES, type CurrencyCode } from "@/lib/types";

export function ShareLibrary() {
  const { library, ready, cloud, updateProfile, updateGame } = useLibrary();
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState("");
  const fieldRef = useRef<HTMLInputElement>(null);
  const publicOn = library.profile.sharePublic !== false;
  const showCollection = library.profile.shareCollection !== false;
  const preview = useMemo(() => toPublicLibrary(library), [library]);
  const forSale = preview.games.filter(isForSale);
  const rest = preview.games.filter((game) => !isForSale(game));
  const hidden = library.games.filter((game) => game.hidden);
  const asking = forSale.reduce((sum, game) => sum + (game.askingPrice ?? 0), 0);
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
    <div className="min-w-0 space-y-8">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Share</p>
          <h1 className="mt-1 text-2xl font-medium">The page you send people</h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Library is your private shelf. This link is the public listing — copies for sale,
            plus the collection you want to show off. Hide the whole shelf, hide one game,
            or show only what is listed.
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
            hint="Off: the link says this shelf is private. Listings and the collection are hidden."
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
                placeholder="Local pickup. Evenings. UPI."
              />
            </Field>
          </div>
        </div>
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
            The public link currently says this shelf is private.
          </p>
        ) : (
          <>
            <h3 className="mt-1 text-2xl font-medium">{`${preview.profile.name}'s library`}</h3>
            <p className="mt-1 text-sm text-white/50">
              {preview.profile.city}
              {preview.profile.city && preview.profile.contact ? " · " : ""}
              {preview.profile.contact}
            </p>
            {preview.profile.note ? (
              <p className="mt-3 max-w-2xl text-sm text-white/70">{preview.profile.note}</p>
            ) : (
              <p className="mt-3 text-sm text-white/40">
                Add a share note so people know how to reach you.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/60">
              <span>{forSale.length} for sale</span>
              {showCollection && (
                <>
                  <span>·</span>
                  <span>{rest.length} on the shelf</span>
                </>
              )}
              {forSale.length > 0 && (
                <>
                  <span>·</span>
                  <span>Asking {money(asking, currency)}</span>
                </>
              )}
            </div>
          </>
        )}
      </section>

      {publicOn && (
        <>
          <section className="min-w-0">
            <h2 className="text-lg font-medium">For sale</h2>
            <p className="mt-1 text-sm text-white/50">
              Listings look like a Discord post — title, price, city, photos of this copy, and the text you wrote.
            </p>
            {forSale.length === 0 ? (
              <p className="mt-3 text-sm text-white/50">
                Nothing listed. Open a physical disc in Library, turn on For sale, and write what a buyer needs to know.
              </p>
            ) : (
              <div className="mt-4">
                <GameGrid
                  games={forSale}
                  readOnly
                  publicView
                  showFilters={false}
                  layout="listings"
                  copyListing
                  currency={currency}
                  seller={preview.profile}
                />
              </div>
            )}
          </section>

          {showCollection && rest.length > 0 && (
            <section className="min-w-0">
              <h2 className="text-lg font-medium">Collection</h2>
              <p className="mt-1 text-sm text-white/50">The rest of the shelf. Not for sale.</p>
              <div className="mt-4">
                <GameGrid
                  games={rest}
                  readOnly
                  publicView
                  showFilters={false}
                  currency={currency}
                  seller={preview.profile}
                />
              </div>
            </section>
          )}
        </>
      )}
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
