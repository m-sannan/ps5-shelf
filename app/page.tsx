"use client";

import { SiteHeader } from "@/components/site-header";
import { VinylShelf } from "@/components/vinyl-shelf";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader showAdd />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-amber-200/80">
            Your copies, not a store wishlist
          </p>
          <h1 className="font-heading mt-2 text-4xl leading-none sm:text-5xl">
            The crate
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every disc sits like a record. Open one to see what you paid, who
            borrowed it, and whether you finished the story — even if you are
            still playing.
          </p>
        </div>
        <VinylShelf />
      </main>
    </div>
  );
}
