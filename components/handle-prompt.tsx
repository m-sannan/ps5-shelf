"use client";

import { useState } from "react";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { handleError, normalizeHandle } from "@/lib/handle";

const DISMISS_KEY = "crate-handle-prompt-v1";

export function HandlePrompt() {
  const { library, signedIn, syncError, updateProfile } = useLibrary();
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState("");
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const handle = library.profile.handle?.trim() ?? "";
  if (!signedIn || handle || dismissed) return null;

  function save() {
    const next = normalizeHandle(draft);
    const problem = !next ? "Use at least 3 characters." : handleError(next);
    if (problem) {
      setHint(problem);
      return;
    }
    updateProfile({ ...library.profile, handle: next });
    setHint("");
  }

  function skip() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* the shelf still works without a public name */
    }
    setDismissed(true);
  }

  const taken = syncError.toLowerCase().includes("handle");

  return (
    <section className="mb-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Public name</p>
      <h2 className="mt-1 text-lg font-medium">What should people call this Crate?</h2>
      <p className="mt-1 text-sm text-white/55">
        The link becomes /s/yourname. Old links keep working. You can skip and set it later on Share.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          value={draft}
          placeholder="sannan"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              save();
            }
          }}
        />
        <Button type="button" onClick={save}>
          Use this name
        </Button>
      </div>
      {hint ? <p className="mt-2 text-sm text-destructive">{hint}</p> : null}
      {taken ? <p className="mt-2 text-sm text-destructive">{syncError}</p> : null}
      <button type="button" className="mt-3 text-sm text-white/45 hover:text-white" onClick={skip}>
        Not now
      </button>
    </section>
  );
}
