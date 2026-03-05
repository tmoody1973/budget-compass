"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBudget } from "@/contexts/budget-context";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type VoiceMode = "briefing" | "tour" | "talk";

interface TourStep {
  title: string;
  description: string;
  icon: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

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
/* Mock response logic (mirrors ask-chat)                              */
/* ------------------------------------------------------------------ */

function getMockVoiceResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("police") || q.includes("safety") || q.includes("fire")) {
    return "Public Safety accounts for about 51% of Milwaukee's general fund. The Police Department receives roughly $307 million and Fire about $137 million annually.";
  }
  if (q.includes("mps") || q.includes("school") || q.includes("education")) {
    return "Milwaukee Public Schools receives 43 cents of every property tax dollar — the largest single share. The 2024 referendum authorized additional funding to address operating deficits.";
  }
  if (q.includes("tax rate") || q.includes("increase") || q.includes("decrease")) {
    return "The gross tax rate decreased from $24.65 to $22.42 per thousand, a 9% drop. However, many homeowners saw higher bills because assessments rose an average of 19.4%.";
  }
  if (q.includes("county") || q.includes("parks") || q.includes("transit")) {
    return "Milwaukee County receives about 14 cents of every tax dollar. That funds parks, the transit system, behavioral health services, and the court system.";
  }
  return "I can help you understand Milwaukee's 2026 budget. Try asking about schools, police, tax rates, or any specific department.";
}

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
  const { assessedValue, totalTax } = useBudget();

  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<VoiceMode>("briefing");

  // Briefing state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Tour state
  const [currentStep, setCurrentStep] = useState(0);

  // Talk state
  const [isRecording, setIsRecording] = useState(false);
  const [talkState, setTalkState] = useState<"idle" | "listening" | "thinking" | "response">("idle");
  const [talkInput, setTalkInput] = useState("");
  const [talkResponse, setTalkResponse] = useState("");

  // Briefing transcript
  const briefingText = `Here's your personalized Milwaukee budget briefing. Based on your home assessed at ${formatCurrency(assessedValue)}, your total annual property tax is approximately ${formatCurrency(totalTax)}. The largest share \u2014 43 cents of every dollar \u2014 goes to Milwaukee Public Schools. The City of Milwaukee receives 34 cents for police, fire, roads, and city services. Milwaukee County gets 14 cents for parks, transit, and courts. The remaining 9 cents is split between MMSD for water management and MATC for workforce training. This year, your gross tax rate decreased from $24.65 to $22.42 per thousand dollars of assessed value, even as most jurisdictions increased their levies. This happened because total assessed property values in Milwaukee rose significantly.`;

  // Simulate audio progress
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + 0.5;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Auto-scroll transcript with progress
  useEffect(() => {
    if (transcriptRef.current && isPlaying) {
      const el = transcriptRef.current;
      const scrollTarget = (progress / 100) * (el.scrollHeight - el.clientHeight);
      el.scrollTo({ top: scrollTarget, behavior: "smooth" });
    }
  }, [progress, isPlaying]);

  // Handle talk recording
  const handleTalkPress = useCallback(() => {
    setIsRecording(true);
    setTalkState("listening");
    setTalkResponse("");
  }, []);

  const handleTalkRelease = useCallback(() => {
    setIsRecording(false);
    setTalkState("thinking");

    // Simulate thinking and response
    setTimeout(() => {
      const mockQuestion = talkInput || "Tell me about my property taxes";
      setTalkResponse(getMockVoiceResponse(mockQuestion));
      setTalkState("response");
    }, 1500);
  }, [talkInput]);

  const resetBriefing = () => {
    setProgress(0);
    setIsPlaying(false);
  };

  return (
    <>
      {/* Keyframes for waveform animation */}
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
            style={{
              animation: "slideUp 0.3s ease-out",
            }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b-2 border-gray-900 px-4 py-3">
              <h2 className="text-base font-bold text-gray-900">
                {"\ud83c\udf99\ufe0f"} Voice Assistant
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsPlaying(false);
                  setIsRecording(false);
                  setTalkState("idle");
                }}
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
              {/* ---- MODE 1: BRIEFING ---- */}
              {activeMode === "briefing" && (
                <div className="flex flex-col gap-4">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-900">Your Budget Briefing</h3>
                    <p className="text-xs text-gray-500">
                      Personalized for your {formatCurrency(assessedValue)} home
                    </p>
                  </div>

                  {/* Waveform */}
                  <div className="flex justify-center py-2">
                    <WaveformBars isPlaying={isPlaying} />
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-900 transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
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
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="rounded-lg border-2 border-gray-900 bg-blue-900 px-5 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_#111] transition-all hover:bg-blue-800 active:translate-y-0.5 active:shadow-none"
                    >
                      {isPlaying ? "\u23f8 Pause" : "\u25b6 Play Budget Briefing"}
                    </button>
                  </div>

                  {/* Transcript */}
                  <div
                    ref={transcriptRef}
                    className="overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-relaxed text-gray-700"
                    style={{ maxHeight: "160px" }}
                  >
                    {briefingText.split(". ").map((sentence, i) => {
                      const sentenceProgress = (i / briefingText.split(". ").length) * 100;
                      const isHighlighted = isPlaying && Math.abs(progress - sentenceProgress) < 12;
                      return (
                        <span
                          key={i}
                          className={`transition-colors duration-300 ${
                            isHighlighted ? "font-semibold text-blue-900" : ""
                          } ${progress >= sentenceProgress && isPlaying ? "text-gray-900" : ""}`}
                        >
                          {sentence}
                          {i < briefingText.split(". ").length - 1 ? ". " : ""}
                        </span>
                      );
                    })}
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

                  {/* Step indicator */}
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

                  {/* Tour card */}
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

                  {/* Audio indicator for tour step */}
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <span>{"\ud83d\udd0a"}</span>
                    <span>Audio narration will play at demo</span>
                  </div>

                  {/* Navigation */}
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

              {/* ---- MODE 3: TALK ---- */}
              {activeMode === "talk" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-900">Live Conversation</h3>
                    <p className="text-xs text-gray-500">Press and hold the mic to talk</p>
                  </div>

                  {/* Mic button */}
                  <div className="relative flex items-center justify-center py-4">
                    {/* Pulsing rings when recording */}
                    {isRecording && (
                      <>
                        <div
                          className="absolute h-28 w-28 rounded-full border-2 border-red-300"
                          style={{
                            animation: "recording-pulse 1.5s ease-in-out infinite",
                          }}
                        />
                        <div
                          className="absolute h-36 w-36 rounded-full border border-red-200"
                          style={{
                            animation: "recording-pulse 1.5s ease-in-out 0.3s infinite",
                          }}
                        />
                      </>
                    )}
                    <button
                      onMouseDown={handleTalkPress}
                      onMouseUp={handleTalkRelease}
                      onTouchStart={handleTalkPress}
                      onTouchEnd={handleTalkRelease}
                      className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-3 text-3xl transition-all ${
                        isRecording
                          ? "border-red-500 bg-red-50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                          : "border-gray-900 bg-white shadow-[3px_3px_0px_0px_#111] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#111] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#111]"
                      }`}
                      aria-label="Press and hold to talk"
                    >
                      {isRecording ? (
                        <span className="inline-block h-5 w-5 rounded-sm bg-red-500" />
                      ) : (
                        "\ud83c\udf99\ufe0f"
                      )}
                    </button>
                  </div>

                  {/* State indicator */}
                  <div className="text-center">
                    {talkState === "idle" && (
                      <p className="text-sm text-gray-500">Tap and hold the mic to ask a question</p>
                    )}
                    {talkState === "listening" && (
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-red-500" />
                        <span className="text-sm font-bold text-red-600">Listening...</span>
                      </div>
                    )}
                    {talkState === "thinking" && (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-blue-900 [animation-delay:0ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-blue-900 [animation-delay:150ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-blue-900 [animation-delay:300ms]" />
                        </div>
                        <span className="text-sm font-bold text-blue-900">Thinking...</span>
                      </div>
                    )}
                    {talkState === "response" && (
                      <div className="w-full max-w-sm rounded-xl border-2 border-gray-900 bg-gray-50 p-4 text-left shadow-[2px_2px_0px_0px_#111]">
                        <p className="text-sm leading-relaxed text-gray-800">{talkResponse}</p>
                      </div>
                    )}
                  </div>

                  {/* Optional text input for testing */}
                  <div className="w-full max-w-sm">
                    <input
                      type="text"
                      value={talkInput}
                      onChange={(e) => setTalkInput(e.target.value)}
                      placeholder="Type a question to test voice response..."
                      className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-xs text-gray-600 outline-none transition-all focus:border-gray-900 focus:shadow-[2px_2px_0px_0px_#111]"
                    />
                  </div>

                  {/* Nova Sonic badge */}
                  <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-center">
                    <p className="text-xs font-medium text-blue-800">
                      {"\ud83c\udf99\ufe0f"} Live voice powered by Amazon Nova Sonic &mdash; coming at demo
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
