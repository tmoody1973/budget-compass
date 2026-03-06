"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBudget } from "@/contexts/budget-context";
import { SonicClient, type SonicState } from "@/lib/sonic-client";
import { SonicVisualizer } from "./sonic-visualizer";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type VoiceMode = "briefing" | "tour" | "talk";

interface TourStep {
  title: string;
  description: string;
  icon: string;
}

interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const SONIC_URL = process.env.NEXT_PUBLIC_SONIC_URL ?? "http://localhost:3001";

const TOUR_STEPS: TourStep[] = [
  {
    title: "Let's explore your tax receipt",
    description:
      "The My Receipt tab breaks down exactly where every dollar of your property tax goes. You'll see each jurisdiction — MPS, the City, County, MMSD, and MATC — with their share shown as a dollar amount, percentage, and daily cost.",
    icon: "\ud83e\uddfe",
  },
  {
    title: "Try the budget treemap",
    description:
      "The Explore tab visualizes Milwaukee's entire budget as an interactive treemap. Larger blocks mean more spending. Click any block to drill into department-level detail and see year-over-year changes.",
    icon: "\ud83d\uddfa\ufe0f",
  },
  {
    title: "Use the simulator",
    description:
      "The Simulate tab lets you play budget director. Drag sliders to increase or decrease funding for departments and see how it impacts your tax bill in real time. Every change shows real consequences.",
    icon: "\ud83c\udf9b\ufe0f",
  },
  {
    title: "Ask me anything",
    description:
      "The Ask tab is your AI budget analyst. Type any question about Milwaukee's budget, tax rates, or spending priorities. The AI understands your home value and persona for personalized answers.",
    icon: "\ud83d\udcac",
  },
];

const MODE_TABS: { id: VoiceMode; label: string; icon: string }[] = [
  { id: "briefing", label: "Briefing", icon: "\ud83d\udcfb" },
  { id: "tour", label: "Tour", icon: "\ud83e\udded" },
  { id: "talk", label: "Talk", icon: "\ud83c\udf99\ufe0f" },
];

/* ------------------------------------------------------------------ */
/* Helper: format currency                                             */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/* ------------------------------------------------------------------ */
/* Waveform Bar Component                                              */
/* ------------------------------------------------------------------ */

function WaveformBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-8">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-blue-900 transition-all"
          style={{
            height: isPlaying ? `${12 + Math.sin(i * 0.7) * 10 + 8}px` : "4px",
            animation: isPlaying
              ? `waveform ${0.4 + (i % 5) * 0.15}s ease-in-out ${(i % 7) * 0.05}s infinite alternate`
              : "none",
            opacity: isPlaying ? 0.8 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */

export function VoicePanel() {
  const { assessedValue, totalTax, jurisdictions, persona } = useBudget();

  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<VoiceMode>("briefing");

  // Briefing state
  const [briefingState, setBriefingState] = useState<"idle" | "loading" | "playing" | "done">("idle");
  const [briefingScript, setBriefingScript] = useState("");
  const [briefingTranscript, setBriefingTranscript] = useState<TranscriptEntry[]>([]);
  const briefingClientRef = useRef<SonicClient | null>(null);
  const briefingTranscriptRef = useRef<HTMLDivElement>(null);
  const [briefingAmplitude, setBriefingAmplitude] = useState(0);
  const [briefingSonicState, setBriefingSonicState] = useState<SonicState>("idle");

  // Tour state
  const [currentStep, setCurrentStep] = useState(0);

  // Talk state
  const sonicClientRef = useRef<SonicClient | null>(null);
  const [sonicState, setSonicState] = useState<SonicState>("idle");
  const [amplitude, setAmplitude] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentToolName, setCurrentToolName] = useState<string | null>(null);
  const [sonicError, setSonicError] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    briefingTranscriptRef.current?.scrollTo({
      top: briefingTranscriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [briefingTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sonicClientRef.current?.disconnect();
      briefingClientRef.current?.disconnect();
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* Talk Mode: Connect / Disconnect                                    */
  /* ---------------------------------------------------------------- */

  const handleTalkToggle = useCallback(async () => {
    if (sonicState !== "idle") {
      // Disconnect
      sonicClientRef.current?.disconnect();
      sonicClientRef.current = null;
      setSonicState("idle");
      return;
    }

    setSonicError(null);
    const client = new SonicClient({
      sonicUrl: SONIC_URL,
      persona: persona || "citizen",
      assessedValue,
      totalTax,
      jurisdictions: jurisdictions.map((j: any) => ({
        shortName: j.shortName,
        yourShare: j.yourShare,
        pct: j.pct,
        rate: j.rate,
      })),
      onStateChange: setSonicState,
      onTranscript: (text, role) => {
        setTranscript((prev) => {
          // Append to last entry if same role, else new entry
          if (prev.length > 0 && prev[prev.length - 1].role === role) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role,
              text: updated[updated.length - 1].text + text,
            };
            return updated;
          }
          return [...prev, { role, text }];
        });
      },
      onToolUse: (toolName, status) => {
        setCurrentToolName(status === "complete" ? null : toolName);
      },
      onAmplitude: setAmplitude,
      onError: (msg) => setSonicError(msg),
    });

    sonicClientRef.current = client;

    try {
      await client.connect();
    } catch {
      // Error already handled via onError callback
    }
  }, [sonicState, persona, assessedValue, totalTax, jurisdictions]);

  /* ---------------------------------------------------------------- */
  /* Briefing Mode: Deep Briefing Flow (Nova Pro -> Nova Sonic)         */
  /* ---------------------------------------------------------------- */

  const handlePlayBriefing = useCallback(async () => {
    if (briefingState === "playing") {
      briefingClientRef.current?.disconnect();
      briefingClientRef.current = null;
      setBriefingState("done");
      return;
    }

    setBriefingState("loading");
    setBriefingTranscript([]);

    try {
      // Step 1: Generate deep briefing script via Nova Pro
      const res = await fetch("/api/voice-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessedValue,
          totalTax,
          persona: persona || "citizen",
          jurisdictions: jurisdictions.map((j: any) => ({
            shortName: j.shortName,
            yourShare: j.yourShare,
            pct: j.pct,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to generate briefing");
      const data = await res.json();
      const script = data.script || data.briefing || "";
      setBriefingScript(script);

      // Step 2: Open Nova Sonic to read the script aloud
      setBriefingState("playing");

      const client = new SonicClient({
        sonicUrl: SONIC_URL,
        persona: "journalist", // briefings use journalist persona
        assessedValue,
        totalTax,
        jurisdictions: jurisdictions.map((j: any) => ({
          shortName: j.shortName,
          yourShare: j.yourShare,
          pct: j.pct,
          rate: j.rate,
        })),
        onStateChange: setBriefingSonicState,
        onTranscript: (text, role) => {
          setBriefingTranscript((prev) => {
            if (prev.length > 0 && prev[prev.length - 1].role === role) {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role,
                text: updated[updated.length - 1].text + text,
              };
              return updated;
            }
            return [...prev, { role, text }];
          });
        },
        onToolUse: () => {},
        onAmplitude: setBriefingAmplitude,
        onError: () => {
          setBriefingState("idle");
          // Fallback: use Web Speech API
          fallbackSpeakBriefing(script);
        },
      });

      briefingClientRef.current = client;
      await client.connect();
    } catch {
      setBriefingState("idle");
      // Fallback to Web Speech API with static text
      const fallbackText = `Here's your personalized Milwaukee budget briefing. Based on your home assessed at ${formatCurrency(assessedValue)}, your total annual property tax is approximately ${formatCurrency(totalTax)}.`;
      fallbackSpeakBriefing(fallbackText);
    }
  }, [briefingState, assessedValue, totalTax, persona, jurisdictions]);

  const fallbackSpeakBriefing = useCallback((text: string) => {
    setBriefingState("playing");
    setBriefingScript(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setBriefingState("done");
    window.speechSynthesis.speak(utterance);
  }, []);

  const resetBriefing = useCallback(() => {
    briefingClientRef.current?.disconnect();
    briefingClientRef.current = null;
    window.speechSynthesis.cancel();
    setBriefingState("idle");
    setBriefingScript("");
    setBriefingTranscript([]);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Close panel handler                                                */
  /* ---------------------------------------------------------------- */

  const handleClose = useCallback(() => {
    setIsOpen(false);
    sonicClientRef.current?.disconnect();
    briefingClientRef.current?.disconnect();
    window.speechSynthesis.cancel();
    setSonicState("idle");
    setBriefingState("idle");
  }, []);

  /* ---------------------------------------------------------------- */
  /* Tool name display                                                  */
  /* ---------------------------------------------------------------- */

  const toolDisplayName = (name: string): string => {
    const map: Record<string, string> = {
      queryBudgetData: "Looking up budget data...",
      searchBudgetDocs: "Searching budget documents...",
      searchNarratives: "Searching narratives...",
    };
    return map[name] ?? `Using ${name}...`;
  };

  return (
    <>
      {/* Keyframes */}
      <style jsx global>{`
        @keyframes waveform {
          0% { height: 4px; }
          100% { height: 28px; }
        }
        @keyframes recording-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-900 bg-blue-900 text-2xl text-white shadow-[3px_3px_0px_0px_#111] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#111] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#111]"
          aria-label="Open voice panel"
        >
          {"\ud83c\udf99\ufe0f"}
        </button>
      )}

      {/* Panel overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
          <div
            className="w-full max-w-lg rounded-t-2xl border-2 border-gray-900 bg-white shadow-[4px_4px_0px_0px_#111] sm:rounded-2xl"
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b-2 border-gray-900 px-4 py-3">
              <h2 className="text-base font-bold text-gray-900">
                {"\ud83c\udf99\ufe0f"} Budget Radio
              </h2>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-900 bg-white text-sm font-bold text-gray-700 shadow-[2px_2px_0px_0px_#111] transition-all hover:bg-gray-100 active:translate-y-0.5 active:shadow-none"
                aria-label="Close voice panel"
              >
                {"\u2715"}
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex border-b border-gray-200">
              {MODE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMode(tab.id)}
                  className={`flex-1 px-3 py-2.5 text-center text-sm font-bold transition-colors ${
                    activeMode === tab.id
                      ? "border-b-2 border-blue-900 bg-blue-50 text-blue-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="p-4" style={{ minHeight: "340px", maxHeight: "480px" }}>

              {/* ---- MODE 1: BRIEFING (Nova Pro -> Nova Sonic) ---- */}
              {activeMode === "briefing" && (
                <div className="flex flex-col gap-4">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-900">Your Budget Briefing</h3>
                    <p className="text-xs text-gray-500">
                      Deep analysis by Nova Pro, voiced by Nova Sonic
                    </p>
                  </div>

                  {/* Visualizer or Waveform */}
                  <div className="flex justify-center py-1">
                    {briefingState === "playing" ? (
                      <SonicVisualizer state={briefingSonicState} amplitude={briefingAmplitude} />
                    ) : (
                      <WaveformBars isPlaying={false} />
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={resetBriefing}
                      className="rounded-lg border-2 border-gray-900 px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#111] transition-all hover:bg-gray-100 active:translate-y-0.5 active:shadow-none"
                    >
                      {"\u23ee"} Reset
                    </button>
                    <button
                      onClick={handlePlayBriefing}
                      disabled={briefingState === "loading"}
                      className="rounded-lg border-2 border-gray-900 bg-blue-900 px-5 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_#111] transition-all hover:bg-blue-800 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
                    >
                      {briefingState === "loading"
                        ? "Generating..."
                        : briefingState === "playing"
                          ? "\u23f8 Stop"
                          : "\u25b6 Play Budget Briefing"}
                    </button>
                  </div>

                  {/* Transcript */}
                  <div
                    ref={briefingTranscriptRef}
                    className="overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-relaxed text-gray-700"
                    style={{ maxHeight: "160px" }}
                  >
                    {briefingTranscript.length > 0 ? (
                      briefingTranscript.map((entry, i) => (
                        <p key={i} className={entry.role === "user" ? "font-semibold text-blue-900" : ""}>
                          {entry.text}
                        </p>
                      ))
                    ) : briefingScript ? (
                      <p>{briefingScript}</p>
                    ) : (
                      <p className="text-gray-400 italic">
                        Press play to hear your personalized budget briefing. Nova Pro analyzes your tax data and Nova Sonic reads it aloud naturally.
                      </p>
                    )}
                  </div>

                  {/* Powered by badge */}
                  <div className="text-center text-[9px] text-gray-400">
                    Analysis by Amazon Nova Pro &middot; Voice by Nova Sonic
                  </div>
                </div>
              )}

              {/* ---- MODE 2: TOUR ---- */}
              {activeMode === "tour" && (
                <div className="flex flex-col gap-4">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-900">Guided App Tour</h3>
                    <p className="text-xs text-gray-500">
                      Step {currentStep + 1} of {TOUR_STEPS.length}
                    </p>
                  </div>

                  <div className="flex justify-center gap-2">
                    {TOUR_STEPS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentStep(i)}
                        className={`h-2.5 rounded-full transition-all ${
                          i === currentStep
                            ? "w-8 bg-blue-900"
                            : i < currentStep
                              ? "w-2.5 bg-blue-400"
                              : "w-2.5 bg-gray-300"
                        }`}
                        aria-label={`Go to step ${i + 1}`}
                      />
                    ))}
                  </div>

                  <div className="rounded-xl border-2 border-gray-900 bg-white p-5 shadow-[3px_3px_0px_0px_#111]">
                    <div className="mb-3 text-center text-3xl">
                      {TOUR_STEPS[currentStep].icon}
                    </div>
                    <h4 className="mb-2 text-center text-base font-bold text-gray-900">
                      {TOUR_STEPS[currentStep].title}
                    </h4>
                    <p className="text-center text-sm leading-relaxed text-gray-600">
                      {TOUR_STEPS[currentStep].description}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <span>{"\ud83d\udd0a"}</span>
                    <span>Audio narration will play at demo</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                      className="rounded-lg border-2 border-gray-900 px-4 py-2 text-sm font-bold shadow-[2px_2px_0px_0px_#111] transition-all hover:bg-gray-100 active:translate-y-0.5 active:shadow-none disabled:opacity-30 disabled:shadow-none"
                    >
                      {"\u2190"} Back
                    </button>
                    <button
                      onClick={() =>
                        setCurrentStep(Math.min(TOUR_STEPS.length - 1, currentStep + 1))
                      }
                      disabled={currentStep === TOUR_STEPS.length - 1}
                      className="rounded-lg border-2 border-gray-900 bg-blue-900 px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_#111] transition-all hover:bg-blue-800 active:translate-y-0.5 active:shadow-none disabled:opacity-30 disabled:shadow-none"
                    >
                      Next {"\u2192"}
                    </button>
                  </div>
                </div>
              )}

              {/* ---- MODE 3: TALK (Live Nova Sonic) ---- */}
              {activeMode === "talk" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-900">Live Conversation</h3>
                    <p className="text-xs text-gray-500">
                      {sonicState === "idle"
                        ? "Tap the mic to start a conversation"
                        : "Speak naturally — Nova Sonic is listening"}
                    </p>
                  </div>

                  {/* Sonic Visualizer Orb */}
                  <SonicVisualizer state={sonicState} amplitude={amplitude} />

                  {/* Tool use indicator */}
                  {currentToolName && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:300ms]" />
                      </div>
                      {toolDisplayName(currentToolName)}
                    </div>
                  )}

                  {/* Mic toggle button */}
                  <button
                    onClick={handleTalkToggle}
                    className={`flex h-16 w-16 items-center justify-center rounded-full border-3 text-2xl transition-all ${
                      sonicState !== "idle"
                        ? "border-red-500 bg-red-50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        : "border-gray-900 bg-white shadow-[3px_3px_0px_0px_#111] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#111]"
                    }`}
                    aria-label={sonicState === "idle" ? "Start conversation" : "End conversation"}
                  >
                    {sonicState !== "idle" ? (
                      <span className="inline-block h-5 w-5 rounded-sm bg-red-500" />
                    ) : (
                      "\ud83c\udf99\ufe0f"
                    )}
                  </button>

                  {/* Error display */}
                  {sonicError && (
                    <div className="w-full max-w-sm rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-600">
                      {sonicError}
                    </div>
                  )}

                  {/* Live transcript */}
                  {transcript.length > 0 && (
                    <div
                      className="w-full max-w-sm overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3"
                      style={{ maxHeight: "140px" }}
                    >
                      {transcript.map((entry, i) => (
                        <div
                          key={i}
                          className={`mb-2 rounded-lg px-3 py-2 text-xs leading-relaxed ${
                            entry.role === "user"
                              ? "ml-8 bg-blue-100 text-blue-900"
                              : "mr-8 bg-white text-gray-800 shadow-sm"
                          }`}
                        >
                          {entry.text}
                        </div>
                      ))}
                      <div ref={transcriptEndRef} />
                    </div>
                  )}

                  {/* Nova Sonic status */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-1.5 text-center">
                    <p className="text-[10px] font-medium text-blue-800">
                      {sonicState !== "idle" ? (
                        <>
                          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                          Nova Sonic Live
                        </>
                      ) : (
                        "Powered by Amazon Nova Sonic"
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
