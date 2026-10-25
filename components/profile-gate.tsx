"use client";

import { useState, useSyncExternalStore } from "react";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseBackup, libraryFromBackup } from "@/lib/backup";
import {
  getStoreSnapshot,
  hasSavedShelf,
  readLegacyAccounts,
  unlockShelf,
  type LegacyAccount,
} from "@/lib/storage";
import type { ShelfState } from "@/lib/storage";

function useBrowserReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function OpeningShelf() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0b0b0d] sm:px-5 sm:py-5">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-1 flex-col items-center justify-center bg-[#161616] px-4 py-12 sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[22px] sm:border sm:border-white/10">
        <p className="text-xs uppercase tracking-[0.32em] text-white/40">
          Crate · PlayStation 5 disc library
        </p>
        <h1 className="mt-3 text-center text-4xl font-medium tracking-tight sm:text-5xl">
          Crate — Letterboxd for your PS5 discs.
        </h1>
        <p className="mt-3 max-w-lg text-center text-sm text-white/65">
          Pin your four favourites, write short takes, share a public shelf card,
          and sync across devices with no login.
        </p>
        <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Public shelf &amp; four favourites</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Claim a memorable handle (/s/yourname), pin the four PS5 cases people see first, and export a 1080×1350 shareable Crate card.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Takes &amp; diary</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Rate games in half-stars, log what you are playing or finished, and share Letterboxd-style review cards.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Add to my shelf &amp; condition photos</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Friends can copy titles into their own Crate in one tap, or browse condition photos and asking prices on discs you list for sale.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Cloud sync with no account</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              Create your shelf in this browser, pair a second phone or laptop with a 6-digit code, or download a JSON backup anytime.
            </p>
          </div>
        </div>
        <p className="mt-6 text-xs text-white/45">Loading your shelf…</p>
      </div>
    </div>
  );
}

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { signedIn, signIn, createShelf, joinShelf, importLegacy, restoreLibrary } =
    useLibrary();
  const browserReady = useBrowserReady();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"copy" | "replace">("copy");
  const [more, setMore] = useState(false);

  if (!browserReady) return <OpeningShelf />;
  if (signedIn) return children;

  const snapshot: ShelfState = getStoreSnapshot();
  const saved = hasSavedShelf(snapshot);
  const legacy: LegacyAccount[] = readLegacyAccounts();

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : label);
    } finally {
      setBusy(false);
    }
  }

  function continueSaved() {
    unlockShelf();
    signIn("local");
  }

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Give this shelf a name.");
      return;
    }
    await run("Could not create the shelf.", () =>
      createShelf({ name: name.trim(), pin: null }),
    );
  }

  async function onJoin(event: React.FormEvent) {
    event.preventDefault();
    const cleaned = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(cleaned)) {
      setError("Enter the six-digit code from your other device.");
      return;
    }
    await run("Could not open that shelf.", () => joinShelf(cleaned));
  }

  async function onRestore(file: File) {
    await run("Could not restore that backup.", async () => {
      const text = await file.text();
      const backup = parseBackup(text);
      await restoreLibrary(libraryFromBackup(backup), restoreMode);
    });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0b0b0d] sm:px-5 sm:py-5">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-1 flex-col items-center justify-center bg-[#161616] px-4 py-12 sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[22px] sm:border sm:border-white/10">
        <p className="text-xs uppercase tracking-[0.32em] text-white/40">
          PlayStation library
        </p>
        <h1 className="mt-3 text-center text-4xl font-medium tracking-tight sm:text-5xl">
          Your cloud shelf
        </h1>
        <p className="mt-3 max-w-lg text-center text-sm text-white/65">
          Letterboxd for your PS5 discs. Pin your four favourites, write short
          takes, share a public shelf card, and sync across devices with no
          login — pair another device with a 6-digit code or restore from a JSON
          backup.
        </p>

        {saved && (
          <div className="mt-10 w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium">Continue on this device</p>
            <p className="text-sm text-white/60">
              {snapshot.name || snapshot.library.profile.name || "Saved shelf"}
              {snapshot.cloud ? " · synced" : " · local copy"}
            </p>
            <Button className="w-full" onClick={continueSaved} disabled={busy}>
              Open shelf
            </Button>
          </div>
        )}

        <form
          onSubmit={onCreate}
          className="mt-8 w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <p className="text-sm font-medium">Create my shelf</p>
          <div className="grid gap-1.5">
            <Label htmlFor="new-shelf">Name</Label>
            <Input
              id="new-shelf"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Sannan"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Create my shelf
          </Button>
        </form>

        {legacy.length > 0 && (
          <div className="mt-8 w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium">Import the shelf already saved on this device</p>
            <p className="text-sm text-white/55">
              Found a local Crate library. Import it into a new cloud shelf.
            </p>
            <div className="flex flex-col gap-2">
              {legacy.map((item) => (
                <Button
                  key={item.id}
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    run("Could not import that shelf.", () => importLegacy(item))
                  }
                >
                  Import {item.name}
                  {item.library.games.length ? ` · ${item.library.games.length} games` : ""}
                </Button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          className="mt-8 text-sm text-white/50 hover:text-white"
          onClick={() => setMore((value) => !value)}
        >
          {more ? "Hide other options" : "I already have a shelf"}
        </button>

        {more && (
          <>
        <form
          onSubmit={onJoin}
          className="mt-4 w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <p className="text-sm font-medium">Open on this device</p>
          <p className="text-sm text-white/55">
            On a phone or laptop that already has the shelf: Settings → Link a
            device. Enter the six-digit code here. It lasts five minutes.
          </p>
          <div className="grid gap-1.5">
            <Label htmlFor="pair-code">Six-digit code</Label>
            <Input
              id="pair-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="000000"
              maxLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Pair this device
          </Button>
        </form>

        <div className="mt-4 w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-medium">Restore from backup</p>
          <p className="text-sm text-white/55">
            Use a downloaded crate-shelf-backup file if every paired device is gone.
          </p>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="radio"
              name="restore-mode"
              checked={restoreMode === "copy"}
              onChange={() => setRestoreMode("copy")}
            />
            Create a separate copy
          </label>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="radio"
              name="restore-mode"
              checked={restoreMode === "replace"}
              onChange={() => setRestoreMode("replace")}
            />
            Replace this shelf
          </label>
          <Input
            type="file"
            accept="application/json,.json"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onRestore(file);
              event.target.value = "";
            }}
          />
        </div>
          </>
        )}

        {error && <p className="mt-4 max-w-md text-center text-sm text-destructive">{error}</p>}
        <p className="mt-8 max-w-lg text-center text-xs text-white/40">
          If every device is lost and you never exported a backup, there is no
          way to prove ownership. That is the tradeoff for having no login.
        </p>
      </div>
    </div>
  );
}
