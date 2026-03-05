"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BudgetChart } from "./budget-chart";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_QUESTIONS = [
  "What is Milwaukee's total 2026 budget?",
  "Compare police and fire department spending",
  "Where do my property tax dollars go?",
  "Top 10 departments by spending",
];

/** Try to extract chart JSON blocks from assistant text */
function extractCharts(text: string) {
  const charts: Array<{
    chartType: "bar" | "line" | "pie" | "treemap";
    title: string;
    data: { label: string; value: number; color?: string }[];
    xLabel?: string;
    yLabel?: string;
    unit?: string;
  }> = [];

  // Look for ```chart ... ``` blocks
  const chartBlocks = text.match(/```chart\s*\n([\s\S]*?)```/g);
  if (chartBlocks) {
    for (const block of chartBlocks) {
      try {
        const json = block.replace(/```chart\s*\n/, "").replace(/```$/, "");
        charts.push(JSON.parse(json));
      } catch {
        // Skip malformed chart blocks
      }
    }
  }
  return charts;
}

/** Remove chart blocks from text for clean display */
function stripChartBlocks(text: string) {
  return text.replace(/```chart\s*\n[\s\S]*?```/g, "").trim();
}

export function Chat({ className }: { className?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const allMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: allMessages }),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + chunk,
                };
              }
              return updated;
            });
          }
        }
      } catch (error) {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: `Error: ${error instanceof Error ? error.message : "Something went wrong"}. Please try again.`,
            };
          }
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  return (
    <div className={`flex h-full flex-col ${className ?? ""}`}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="font-head text-2xl font-bold text-mke-blue">
              MKE Budget Compass
            </h2>
            <p className="mt-2 max-w-md text-sm text-gray-600">
              Ask anything about Milwaukee&apos;s $1.4B city budget. I&apos;ll
              look up the real numbers and show you charts.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-lg border-2 border-mke-dark bg-white px-3 py-2 text-sm font-medium text-mke-dark shadow-[2px_2px_0px_0px_#1A1A2E] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#1A1A2E]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const charts = msg.role === "assistant" ? extractCharts(msg.content) : [];
          const cleanText = msg.role === "assistant" ? stripChartBlocks(msg.content) : msg.content;

          return (
            <div
              key={msg.id}
              className={`mb-4 ${msg.role === "user" ? "flex justify-end" : ""}`}
            >
              <div
                className={`max-w-[85%] rounded-lg border-2 border-mke-dark p-3 shadow-[3px_3px_0px_0px_#1A1A2E] ${
                  msg.role === "user"
                    ? "bg-mke-blue text-white"
                    : "bg-white text-mke-dark"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {cleanText || (isLoading && msg.content === "" ? "Thinking..." : "")}
                </div>
                {charts.map((chart, i) => (
                  <div key={i} className="mt-3">
                    <BudgetChart {...chart} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t-2 border-mke-dark bg-white p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about Milwaukee's budget..."
            rows={1}
            className="flex-1 resize-none rounded-lg border-2 border-mke-dark px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mke-blue"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg border-2 border-mke-dark bg-mke-blue px-4 py-2 font-bold text-white shadow-[2px_2px_0px_0px_#1A1A2E] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#1A1A2E] disabled:opacity-50"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
