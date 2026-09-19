"use client";

import { useMemo, useRef, useState } from "react";
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
import { conditionPhotos, isForSale } from "@/lib/photos";
import { toPublicLibrary } from "@/lib/public-view";
import { CURRENCIES, type CurrencyCode } from "@/lib/types";

type PreviewMode = "friends" | "me";

export function ShareLibrary() {
  const { library, ready, cloud, updateProfile } = useLibrary();
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState("");
  const [mode, setMode] = useState<PreviewMode>("friends");
  const fieldRef = useRef<HTMLInputElement>(null);
  const friends = useMemo(() => toPublicLibrary(library), [library]);
  const shown = mode === "friends" ? friends : library;
  const forSale = useMemo(
    () => shown.games.filter(isForSale),
    [shown.games],
  );
  const rest = useMemo(
    () =>
      shown.games.filter((game) =>
        mode === "friends" ? !isForSale(game) : game.status !== "sold" && !isForSale(game),
      ),
    [shown.games, mode],
  );
  const sold = useMemo(
    () => (mode === "me" ? library.games.filter((game) => game.status === "sold") : []),
    [library.games, mode],
  );
  const listedWithoutPhotos = useMemo(
    () => forSale.filter((game) => conditionPhotos(game).length === 0).length,
    [forSale],
  );
  const currency = shown.profile.currency;
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
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Share</p>
          <h1 className="mt-1 text-2xl font-medium">
            {library.profile.name || "Your shelf"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Toggle Friends to see the public link. Toggle Me to edit your seller card
            and check the private details friends never get.
          </p>
        </div>
        <Button onClick={copyLink}>{copied ? "Link copied" : "Copy public link"}</Button>
      </div>

      <div className="flex gap-1.5">
        {(
          [
            ["friends", "Friends"],
            ["me", "Me"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              mode === id ? "bg-[#2f2f32] text-white" : "text-white/45 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
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

      {mode === "me" ? (
        <section className="rounded-2xl bg-white/4 p-5 ring-1 ring-white/8">
          <p className="font-medium">Seller card</p>
          <p className="mt-1 text-sm text-white/50">
            This is the header friends see on your public link. City and contact are how they reach you about a listed copy.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                />
              </Field>
            </div>
          </div>
        </section>
      ) : (
        <section>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Public shelf</p>
          <h2 className="mt-1 text-xl font-medium">{`${friends.profile.name}'s library`}</h2>
          <p className="mt-1 text-sm text-white/50">
            {friends.profile.city}
            {friends.profile.city && friends.profile.contact ? " · " : ""}
            {friends.profile.contact}
          </p>
          {friends.profile.note ? (
            <p className="mt-3 max-w-2xl text-sm text-white/70">{friends.profile.note}</p>
          ) : (
            <p className="mt-3 text-sm text-white/40">
              Add a share note on Me so friends know how to reach you.
            </p>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-2 text-sm text-white/60">
        <span>{forSale.length} for sale</span>
        <span>·</span>
        <span>{rest.length} on the shelf</span>
        {mode === "me" && sold.length > 0 && (
          <>
            <span>·</span>
            <span>{sold.length} sold</span>
          </>
        )}
        {forSale.length > 0 && (
          <>
            <span>·</span>
            <span>Asking {money(asking, currency)}</span>
          </>
        )}
      </div>

      {listedWithoutPhotos > 0 && (
        <p className="rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {listedWithoutPhotos === 1
            ? "One listed copy has no photos of the disc. Friends only see box art until you add shots of this copy."
            : `${listedWithoutPhotos} listed copies have no photos of the disc. Friends only see box art until you add shots of those copies.`}
        </p>
      )}

      <section className="min-w-0">
        <h2 className="text-lg font-medium">For sale</h2>
        {forSale.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">
            Nothing listed. Open a physical disc in Library, turn on For sale, and set an asking price.
          </p>
        ) : (
          <div className="mt-4">
            <GameGrid
              games={forSale}
              readOnly={mode === "friends"}
              publicView={mode === "friends"}
              showFilters={false}
              currency={currency}
            />
          </div>
        )}
      </section>

      {rest.length > 0 && (
        <section className="min-w-0">
          <h2 className="text-lg font-medium">On the shelf</h2>
          <p className="mt-1 text-sm text-white/50">
            {mode === "friends"
              ? "The rest of the collection. Not for sale."
              : "Your copies, including paid price and who you borrowed from."}
          </p>
          <div className="mt-4">
            <GameGrid
              games={rest}
              readOnly={mode === "friends"}
              publicView={mode === "friends"}
              showFilters={false}
              currency={currency}
            />
          </div>
        </section>
      )}

      {sold.length > 0 && (
        <section className="min-w-0">
          <h2 className="text-lg font-medium">Sold</h2>
          <p className="mt-1 text-sm text-white/50">Hidden from the public link.</p>
          <div className="mt-4">
            <GameGrid games={sold} showFilters={false} currency={currency} />
          </div>
        </section>
      )}
    </div>
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
