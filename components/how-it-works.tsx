"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

const KEY = "crate-guide-v2";

const STEPS = [
  {
    title: "Library is only yours",
    body: "Add discs, rate them, mark Playing or Done. Friends never see borrowed-from, what you paid, or private notes.",
  },
  {
    title: "Pin four favourites",
    body: "Those four cases are the face of your public Crate. Same idea as Letterboxd posters. You can also pick a handle so the link is a name, not a code.",
  },
  {
    title: "Share is the Crate you send",
    body: "Copy the link or download the card. Collection first, what you are playing, then copies for sale at the bottom if you want. Hide a game or the whole shelf any time.",
  },
];

function subscribeGuide() {
  return () => {};
}

function guideUnseen() {
  try {
    return window.localStorage.getItem(KEY) !== "done";
  } catch {
    return true;
  }
}

export function HowItWorks({
  force = false,
  onClose,
}: {
  force?: boolean;
  onClose?: () => void;
}) {
  const unseen = useSyncExternalStore(subscribeGuide, guideUnseen, () => false);
  const [step, setStep] = useState(0);
  const [closed, setClosed] = useState(false);
  const open = !closed && (force || unseen);

  function finish() {
    try {
      window.localStorage.setItem(KEY, "done");
    } catch {
      /* ignore */
    }
    setClosed(true);
    onClose?.();
  }

  if (!open || typeof document === "undefined") return null;
  const current = STEPS[step];

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161616] p-5 shadow-2xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
          How Crate works · {step + 1} of {STEPS.length}
        </p>
        <h2 className="mt-2 text-xl font-medium">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">{current.body}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" className="text-sm text-white/45 hover:text-white" onClick={finish}>
            Skip
          </button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep((value) => value + 1)}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={finish}>
              Got it
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
