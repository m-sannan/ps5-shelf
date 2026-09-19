"use client";

import { useEffect, useState } from "react";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  backupFilename,
  buildCompleteBackup,
  libraryFromBackup,
  parseBackup,
  stringifyBackup,
} from "@/lib/backup";
import { publicShelfPath } from "@/lib/cloud/client";
import { copyText } from "@/lib/copy-text";

export function SettingsPage() {
  const {
    library,
    cloud,
    syncing,
    syncError,
    requestPairCode,
    restoreLibrary,
  } = useLibrary();
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(0);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [restoreMode, setRestoreMode] = useState<"copy" | "replace">("copy");

  useEffect(() => {
    if (!pairCode || expiresIn <= 0) return;
    const timer = window.setInterval(() => {
      setExpiresIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pairCode, expiresIn]);

  async function downloadBackup() {
    setBusy("backup");
    setError("");
    try {
      const backup = await buildCompleteBackup(library);
      const blob = new Blob([stringifyBackup(backup)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = backupFilename();
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Backup downloaded. Keep this file somewhere safe.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the backup.");
    } finally {
      setBusy("");
    }
  }

  async function onRestore(file: File) {
    setBusy("restore");
    setError("");
    try {
      const backup = parseBackup(await file.text());
      await restoreLibrary(libraryFromBackup(backup), restoreMode);
      setMessage(
        restoreMode === "replace"
          ? "This shelf was replaced from the backup."
          : "Restored as a separate copy.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore that file.");
    } finally {
      setBusy("");
    }
  }

  async function linkDevice() {
    setBusy("pair");
    setError("");
    try {
      const result = await requestPairCode();
      setPairCode(result.code);
      setExpiresIn(result.expiresIn);
      setMessage("On the new device, choose Open existing shelf and type this code.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a pairing code.");
    } finally {
      setBusy("");
    }
  }

  async function copyShare() {
    if (!cloud?.publicId) {
      setError("Share links are available after this shelf is online.");
      return;
    }
    const url = `${window.location.origin}${publicShelfPath(cloud.publicId, library.profile.handle)}`;
    const result = await copyText(url);
    if (result === "copied") {
      setError("");
      setMessage("Public share link copied. Friends can view, not edit.");
      return;
    }
    setError("");
    setMessage("Clipboard is blocked in this window. Select the link below and copy it.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Device & recovery</p>
        <h1 className="mt-1 text-2xl font-medium">Settings</h1>
        <p className="mt-2 text-sm text-white/55">
          Cloud is canonical. This browser keeps a fast local copy
          {cloud ? " and a private device key." : "."}{" "}
          {syncing ? "Syncing…" : cloud ? "Online." : "Local only until the next successful save."}
        </p>
        {syncError && <p className="mt-2 text-sm text-destructive">{syncError}</p>}
      </div>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-medium">Link a device</p>
        <p className="text-sm text-white/55">
          Creates a one-time six-digit code. It is not a password. It expires in
          five minutes and pairs a new trusted editor.
        </p>
        <Button onClick={linkDevice} disabled={busy === "pair" || !cloud}>
          {busy === "pair" ? "Creating code…" : "Link a device"}
        </Button>
        {pairCode && (
          <div className="rounded-xl bg-black/30 px-4 py-5 text-center">
            <p className="font-mono text-4xl tracking-[0.35em]">{pairCode}</p>
            <p className="mt-2 text-xs text-white/45">
              {expiresIn > 0 ? `Expires in ${expiresIn}s` : "Expired. Create a new code."}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-medium">JSON backup</p>
        <p className="text-sm text-white/55">
          Downloads profile, games, loans, prices, statuses, notes, and compressed
          artwork. This is the recovery kit if every paired device is gone.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadBackup} disabled={busy === "backup"}>
            {busy === "backup" ? "Preparing…" : "Download shelf backup"}
          </Button>
        </div>
        <div className="grid gap-2 pt-2">
          <p className="text-sm font-medium">Restore from backup</p>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="radio"
              name="settings-restore"
              checked={restoreMode === "copy"}
              onChange={() => setRestoreMode("copy")}
            />
            Create a separate copy
          </label>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="radio"
              name="settings-restore"
              checked={restoreMode === "replace"}
              onChange={() => setRestoreMode("replace")}
            />
            Replace this shelf
          </label>
          <Input
            type="file"
            accept="application/json,.json"
            disabled={Boolean(busy)}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onRestore(file);
              event.target.value = "";
            }}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-medium">Public share link</p>
        <p className="text-sm text-white/55">
          Read-only. This is your public Crate — four favourites, the collection, then
          any copies for sale. Hide the whole shelf or a single game from Share.
          What you paid stays private. Sold copies stay hidden. The device key is
          never in this URL.
        </p>
        {cloud?.publicId && (
          <Input
            readOnly
            value={
              typeof window !== "undefined"
                ? `${window.location.origin}${publicShelfPath(cloud.publicId, library.profile.handle)}`
                : publicShelfPath(cloud.publicId, library.profile.handle)
            }
            onFocus={(event) => event.currentTarget.select()}
            className="font-mono text-xs"
          />
        )}
        <Button variant="secondary" onClick={copyShare}>
          Copy public link
        </Button>
      </section>

      {message && <p className="text-sm text-white/70">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
