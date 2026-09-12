"use client";

import { ShareLibrary } from "@/components/share-library";
import { SiteHeader } from "@/components/site-header";

export default function SharePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <ShareLibrary />
      </main>
    </div>
  );
}
