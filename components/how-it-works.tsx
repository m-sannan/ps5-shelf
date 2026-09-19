"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

const KEY = "crate-guide-v1";

const STEPS = [
  {
    title: "Library is only yours",
    body: "Add games, rate them, mark Playing or Done. This is your landing page. Friends never see borrowed-from, what you paid, or private notes.",
  },
  {
    title: "A listing is a post",
    body: "Open a physical disc, turn on For sale, set a price, and write the line a buyer needs — PS5 or PS4, complete in box, pickup in your city. Add photos of this copy, not just box art.",
  },
  {
    title: "Share is what you send",
    body: "Copy the public link for Discord or a friend. Show the whole collection as a brag, hide individual games, or show only copies for sale. Library stays private.",
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
