"use client";

import { AppFrame } from "@/components/app-frame";
import { GameGrid } from "@/components/game-grid";

export default function HomePage() {
  return (
    <AppFrame showAdd>
      <GameGrid />
    </AppFrame>
  );
}
