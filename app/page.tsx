"use client";

import { CaseRail } from "@/components/case-rail";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader showAdd tone="overlay" />
      <main className="flex-1 pt-24">
        <CaseRail />
      </main>
    </div>
  );
}
