"use client";

import { useState, useRef, useEffect } from "react";
import { useBudget } from "@/contexts/budget-context";

const STEPS = [
  {
    title: "The Big Picture",
    emoji: "\ud83c\udfdb\ufe0f",
    question: "Give me a simple overview of Milwaukee's total budget. How much does the city spend and where does the money come from? Keep it brief and use simple language.",
  },
  {
    title: "Where Your Money Goes",
    emoji: "\ud83d\udcb0",
    question: "Break down the major categories of city spending in simple terms. What are the biggest areas and roughly what percentage goes to each?",
  },
  {
    title: "Your Personal Share",
    emoji: "\ud83c\udfe0",
    question: "For a home assessed at $ASSESSED_VALUE, how much do I pay in total property tax and which jurisdiction gets the biggest share? Explain it like I'm seeing my first tax bill.",
  },
  {
    title: "Schools & Education",
    emoji: "\ud83c\udf93",
    question: "How does MPS (Milwaukee Public Schools) funding work? How much of my property tax goes to schools and what does it pay for?",
  },
  {
    title: "Public Safety",
    emoji: "\ud83d\udee1\ufe0f",
    question: "How much does Milwaukee spend on police and fire? How does that compare to other major spending areas? Is it going up or down?",
  },
  {
    title: "Your Neighborhood",
    emoji: "\ud83c\udfd8\ufe0f",
    question: "What city services directly affect my daily life as a Milwaukee resident? Things like trash, roads, parks, libraries -- how much goes to these?",
  },
];

export function Budget101() {
  const { assessedValue } = useBudget();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const step = STEPS[currentStep];
  const personalizedQuestion = step.question.replace(
    "$ASSESSED_VALUE",
    `$${assessedValue.toLocaleString()}`
  );

  // Auto-fetch when step changes or assessedValue changes
  useEffect(() => {
    if (responses[currentStep] !== undefined) return;

    let cancelled = false;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

    // Compute question inside effect to avoid stale closure
    const question = STEPS[currentStep].question.replace(
      "$ASSESSED_VALUE",
      `$${assessedValue.toLocaleString()}`
    );

    async function fetchResponse() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: question }],
          }),
        });

        if (!res.ok) throw new Error(`API ${res.status}`);

        reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let content = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          content += decoder.decode(value, { stream: true });
          setResponses((prev) => ({ ...prev, [currentStep]: content }));
        }
      } catch {
        if (!cancelled) {
          setResponses((prev) => ({
            ...prev,
            [currentStep]: "Could not load this section. Please check your connection and try again.",
          }));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchResponse();
    return () => {
      cancelled = true;
      reader?.cancel().catch(() => {});
    };
  }, [currentStep, assessedValue]);

  // Scroll to top when step changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-lg border-2 border-gray-900 bg-white p-4 shadow-[4px_4px_0px_0px_#111]">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-black text-mke-dark">
            {step.emoji} Budget 101
          </h2>
          <span className="text-sm font-bold text-gray-500">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full border-2 border-gray-900 bg-gray-100">
          <div
            className="h-full bg-mke-blue transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="mt-3 flex justify-between">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                i === currentStep
                  ? "text-mke-blue"
                  : i < currentStep
                    ? "text-green-600"
                    : "text-gray-400"
              }`}
            >
              <span className="text-base">{s.emoji}</span>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content card */}
      <div className="rounded-lg border-2 border-gray-900 bg-white shadow-[4px_4px_0px_0px_#111]">
        <div className="border-b-2 border-gray-900 bg-mke-blue px-6 py-4">
          <h3 className="text-2xl font-black text-white">
            {step.emoji} {step.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-white/70">
            {personalizedQuestion}
          </p>
        </div>

        <div
          ref={scrollRef}
          className="overflow-y-auto px-6 py-5"
          style={{ minHeight: "300px", maxHeight: "500px" }}
        >
          {isLoading && !responses[currentStep] ? (
            <div className="flex items-center gap-3 text-gray-500">
              <div className="flex gap-1">
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-mke-blue [animation-delay:0ms]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-mke-blue [animation-delay:150ms]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-mke-blue [animation-delay:300ms]" />
              </div>
              <span className="text-base font-medium">Nova is looking this up...</span>
            </div>
          ) : (
            <div className="prose prose-base max-w-none text-gray-800 leading-relaxed">
              {(responses[currentStep] ?? "").split("\n").map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                if (line.startsWith("**") && line.endsWith("**")) {
                  return <p key={i} className="font-black text-mke-dark">{line.replace(/\*\*/g, "")}</p>;
                }
                if (line.startsWith("- ") || line.startsWith("* ")) {
                  return <p key={i} className="ml-4 before:content-['•_'] before:font-bold">{line.slice(2)}</p>;
                }
                return <p key={i}>{line}</p>;
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t-2 border-gray-900 px-6 py-4">
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="rounded-lg border-2 border-gray-900 bg-white px-5 py-2.5 text-base font-bold shadow-[3px_3px_0px_0px_#111] transition-all hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#111] disabled:opacity-30 disabled:shadow-none"
          >
            &larr; Back
          </button>

          <button
            onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={currentStep === STEPS.length - 1}
            className="rounded-lg border-2 border-gray-900 bg-mke-blue px-5 py-2.5 text-base font-bold text-white shadow-[3px_3px_0px_0px_#111] transition-all hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#111] disabled:opacity-30 disabled:shadow-none"
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
