"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";

const AskMode = dynamic(
  () => import("@/components/modes/ask-mode").then((m) => m.AskMode),
  { ssr: false },
);

const RemixMode = dynamic(
  () => import("@/components/modes/remix-mode").then((m) => ({ default: m.RemixMode })),
  { ssr: false },
);

const SeeMode = dynamic(
  () => import("@/components/modes/see-mode").then((m) => ({ default: m.SeeMode })),
  { ssr: false },
);

const HearMode = dynamic(
  () => import("@/components/modes/hear-mode").then((m) => ({ default: m.HearMode })),
  { ssr: false },
);

const MODES = [
  { id: "ask", label: "Ask", emoji: "\ud83d\udcac" },
  { id: "remix", label: "Remix", emoji: "\ud83c\udf9b\ufe0f" },
  { id: "see", label: "See", emoji: "\ud83c\udfa8" },
  { id: "hear", label: "Hear", emoji: "\ud83c\udfa7" },
] as const;

type ModeId = (typeof MODES)[number]["id"];

export default function Home() {
  const [activeMode, setActiveMode] = useState<ModeId>("ask");

  return (
    <main className="min-h-screen bg-mke-cream">
      {/* Header */}
      <header className="border-b-2 border-mke-dark bg-white px-6 py-3 shadow-[0_2px_0px_0px_#1A1A2E]">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="font-head text-2xl font-bold text-mke-blue">
            MKE Budget Compass
          </h1>
          <div className="flex items-center gap-4">
            <nav className="flex gap-2">
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`rounded-lg border-2 border-mke-dark px-4 py-2 text-sm font-bold transition-all ${
                    activeMode === mode.id
                      ? "bg-mke-blue text-white shadow-[2px_2px_0px_0px_#1A1A2E]"
                      : "bg-white text-mke-dark shadow-[3px_3px_0px_0px_#1A1A2E] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-mke-cream hover:shadow-[1px_1px_0px_0px_#1A1A2E]"
                  }`}
                >
                  {mode.emoji} {mode.label}
                </button>
              ))}
            </nav>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Mode content */}
      <div className="mx-auto h-[calc(100vh-64px)] max-w-6xl p-6">
        {activeMode === "ask" && <AskMode />}
        {activeMode === "remix" && <RemixMode />}
        {activeMode === "see" && <SeeMode />}
        {activeMode === "hear" && <HearMode />}
      </div>
    </main>
  );
}
