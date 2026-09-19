"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, Library, Settings, Share2 } from "lucide-react";
import { AddGameSheet } from "@/components/add-game-sheet";
import { HowItWorks } from "@/components/how-it-works";
import { useLibrary } from "@/components/library-provider";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Library", icon: Library },
  { href: "/ledger", label: "Money", icon: Banknote },
  { href: "/share", label: "Share", icon: Share2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppFrame({
  children,
  showAdd = false,
}: {
  children: React.ReactNode;
  showAdd?: boolean;
}) {
  return (
    <div className="flex h-dvh min-h-0 flex-1 flex-col overflow-hidden bg-[#0b0b0d] sm:h-auto sm:min-h-full sm:overflow-visible sm:px-5 sm:py-5">
      <div className="relative mx-auto flex h-full min-h-0 w-full min-w-0 max-w-6xl flex-1 flex-col overflow-hidden bg-[#161616] sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[22px] sm:border sm:border-white/10 sm:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <SiteHeader showAdd={showAdd} />
        <div
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pt-4 sm:px-6 sm:pb-6",
            showAdd ? "pb-36" : "pb-28",
            "sm:pb-6",
          )}
        >
          {children}
        </div>
        <MobileDock />
        {showAdd && <AddGameSheet variant="fab" />}
      </div>
      <HowItWorks />
    </div>
  );
}

function SiteHeader({ showAdd }: { showAdd?: boolean }) {
  const pathname = usePathname();
  const { cloud, syncing } = useLibrary();

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-white/8 bg-[#161616]/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md sm:px-6 sm:pt-3">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[15px] font-medium tracking-tight">
          Crate
        </Link>
        <nav className="hidden flex-1 items-center gap-1.5 sm:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                pathname === link.href
                  ? "bg-[#2a2a2c] text-white"
                  : "text-white/50 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {cloud && (
            <span className="hidden text-[11px] text-white/35 sm:inline">
              {syncing ? "Syncing" : "Cloud"}
            </span>
          )}
          {showAdd && <AddGameSheet variant="header" />}
        </div>
      </div>
    </header>
  );
}

function MobileDock() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[#161616]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md sm:hidden">
      <ul className="grid grid-cols-4">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px]",
                  active ? "text-white" : "text-white/45",
                )}
              >
                <Icon className="size-5" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ShareGuideButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="text-sm text-white/50 hover:text-white"
        onClick={() => setOpen(true)}
      >
        How this works
      </button>
      {open ? <HowItWorks force onClose={() => setOpen(false)} /> : null}
    </>
  );
}
