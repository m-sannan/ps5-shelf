"use client";

import { AppFrame } from "@/components/app-frame";
import { Ledger } from "@/components/ledger";

export default function LedgerPage() {
  return (
    <AppFrame showAdd>
      <Ledger />
    </AppFrame>
  );
}
