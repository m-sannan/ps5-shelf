"use client";

import { CaseRail } from "@/components/case-rail";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader showAdd />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <p className="text-center text-xs uppercase tracking-[0.28em] text-sky-300">
          Physical copies
        </p>
        <h1 className="mt-2 text-center text-3xl font-medium tracking-tight sm:text-4xl">
          Game library
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-white/60">
          Flip through cases like the old dashboard. Click the centre copy to
          open the box and see the disc.
        </p>
        <div className="mt-6">
          <CaseRail />
        </div>
      </main>
    </div>
  );
}
