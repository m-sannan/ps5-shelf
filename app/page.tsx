"use client";

import { CaseRail } from "@/components/case-rail";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader showAdd />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-8 pt-3 sm:px-4">
        <CaseRail />
      </main>
    </div>
  );
}
