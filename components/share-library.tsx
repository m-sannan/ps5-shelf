"use client";

import { useMemo, useState } from "react";
import { CaseRail } from "@/components/case-rail";
import { useLibrary } from "@/components/library-provider";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { libraryStats } from "@/lib/stats";

export function ShareLibrary() {
  const { library, ready } = useLibrary();
  const [copied, setCopied] = useState(false);
  const stats = libraryStats(library);
  const listed = useMemo(
    () => library.games.filter((game) => game.status !== "sold"),
    [library.games],
  );
  const currency = library.profile.currency;

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/share`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Opening the library…</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-sky-300">
          For sale & show-around
        </p>
        <h1 className="mt-2 text-4xl font-medium tracking-tight sm:text-5xl">
          {library.profile.name}&apos;s library
        </h1>
        <p className="mt-2 text-muted-foreground">
          {library.profile.city}
          {library.profile.city && library.profile.contact ? " · " : ""}
          {library.profile.contact}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
          {library.profile.note}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-black/30 px-3 py-1">
            {listed.length} copies
          </span>
          <span className="rounded-full bg-black/30 px-3 py-1">
            {stats.forSale} listed
          </span>
          <span className="rounded-full bg-black/30 px-3 py-1">
            Asking {money(stats.asking, currency)}
          </span>
        </div>
        <Button className="mt-6" onClick={copyLink}>
          {copied ? "Link copied" : "Copy share link"}
        </Button>
      </section>
      <CaseRail games={listed} readOnly />
    </div>
  );
}

