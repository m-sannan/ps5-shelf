"use client";

import { Ledger } from "@/components/ledger";
import { SiteHeader } from "@/components/site-header";

export default function LedgerPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f6f7fb] text-zinc-900">
      <SiteHeader showAdd tone="light" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:py-8">
        <Ledger />
      </main>
    </div>
  );
}
