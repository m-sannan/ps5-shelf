"use client";

import { Ledger } from "@/components/ledger";
import { SiteHeader } from "@/components/site-header";

export default function LedgerPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader showAdd />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <p className="text-xs uppercase tracking-[0.28em] text-sky-300">
          Cost, loans, sales
        </p>
        <h1 className="mt-2 text-4xl font-medium tracking-tight">Money</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/60">
          Amounts follow the currency on your profile. Sample copies are in
          Indian rupees.
        </p>
        <div className="mt-8">
          <Ledger />
        </div>
      </main>
    </div>
  );
}
