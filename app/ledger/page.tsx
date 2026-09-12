"use client";

import { Ledger } from "@/components/ledger";
import { SiteHeader } from "@/components/site-header";

export default function LedgerPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader showAdd />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-amber-200/80">
            Cost, loans, sales
          </p>
          <h1 className="font-heading mt-2 text-4xl leading-none sm:text-5xl">
            What the shelf cost
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Purchase prices, money from people who borrowed copies, and what
            you recouped when a disc left the crate.
          </p>
        </div>
        <Ledger />
      </main>
    </div>
  );
}
