"use client";

import dynamic from "next/dynamic";

// The 3D world only runs in the browser.
const Game = dynamic(() => import("@/game/Game"), {
  ssr: false,
  loading: () => <div className="loading">unlocking the shop…</div>,
});

export default function Home() {
  return <Game />;
}
