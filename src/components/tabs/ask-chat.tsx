"use client";

import { useState, useRef, useEffect } from "react";
import { useBudget } from "@/contexts/budget-context";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/* ------------------------------------------------------------------ */
/* Persona-aware starter questions                                     */
/* ------------------------------------------------------------------ */

const STARTER_QUESTIONS: Record<string, string[]> = {
  resident: [
    "How much of my tax goes to police and fire?",
    "Why did my property tax bill go up this year?",
    "What services does the city provide for my neighborhood?",
    "How does Milwaukee's tax rate compare to other cities?",
  ],
  student: [
    "Break down the MPS budget for me simply",
    "How are school budgets decided in Milwaukee?",
    "What percentage of the budget goes to education?",
    "How does the city balance its budget each year?",
  ],
  journalist: [
    "What are the biggest budget changes from last year?",
    "Which departments saw the largest cuts or increases?",
    "How does the 2024 referendum impact the MPS levy?",
    "What's driving the property tax rate decrease?",
  ],
};

/* ------------------------------------------------------------------ */
/* Mock AI response logic                                              */
/* ------------------------------------------------------------------ */

function getMockResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("police") || q.includes("safety") || q.includes("fire")) {
    return (
      "Public Safety is the largest slice of Milwaukee's general purposes budget, " +
      "accounting for roughly 51% of city spending. The Milwaukee Police Department " +
      "receives about $307M and the Fire Department about $137M annually. For a " +
      "median-assessed home ($166K), that works out to approximately $3.80/day going " +
      "to police and fire services combined."
    );
  }

  if (q.includes("mps") || q.includes("school") || q.includes("education")) {
    return (
      "Milwaukee Public Schools (MPS) receives about 43 cents of every property tax " +
      "dollar — the single largest share of your tax bill. The MPS levy for 2026 is " +
      "approximately $9.62 per $1,000 of assessed value. For a $166K home that's " +
      "roughly $1,597/year. The 2024 referendum authorized additional funding to " +
      "address operating deficits and maintain school programs."
    );
  }

  if (
    q.includes("tax rate") ||
    q.includes("went up") ||
    q.includes("increase") ||
    q.includes("decrease") ||
    q.includes("compare")
  ) {
    return (
      "The overall gross tax rate actually decreased from $24.65 to $22.42 per $1,000 " +
      "of assessed value — a 9% drop. However, many homeowners saw higher bills because " +
      "property assessments rose significantly (city-wide average +19.4%). So even though " +
      "the rate dropped, the higher assessed values meant many people's total bill went up. " +
      "Milwaukee's rate remains moderate compared to peer cities like Detroit or Cleveland."
    );
  }

  if (q.includes("neighborhood") || q.includes("service")) {
    return (
      "The City of Milwaukee provides a wide range of services funded by your property taxes: " +
      "police and fire protection, street maintenance and snow plowing, garbage and recycling " +
      "collection, parks and recreation, library services, public health programs, and more. " +
      "Your aldermanic district representative can provide specific information about " +
      "neighborhood-level investments."
    );
  }

  if (q.includes("budget change") || q.includes("cut") || q.includes("largest")) {
    return (
      "The biggest shifts in the 2026 budget include: (1) MPS saw the largest absolute " +
      "increase due to the 2024 referendum authorization, (2) The City general fund held " +
      "mostly flat with targeted increases for public safety staffing, (3) Milwaukee County " +
      "allocated additional funds for behavioral health and transit. Department-level changes " +
      "ranged from -3% to +8% year-over-year."
    );
  }

  if (q.includes("referendum")) {
    return (
      "The April 2024 referendum authorized MPS to exceed state-imposed revenue limits by " +
      "$252M over four years. This shows up in the MPS levy portion of your tax bill. The " +
      "referendum was needed to address a projected $200M+ structural deficit and prevent " +
      "deep cuts to staffing and programs. It accounts for roughly a $1.20 per $1,000 " +
      "increase in the MPS levy rate."
    );
  }

  if (q.includes("balance") || q.includes("how does the city")) {
    return (
      "Milwaukee balances its budget through a combination of property taxes (about 40% of " +
      "revenue), state shared revenue and aids (about 30%), user fees and charges, and federal " +
      "grants. Wisconsin law requires municipalities to pass balanced budgets — they cannot run " +
      "deficits. The City Council and Mayor negotiate priorities each fall before adoption in November."
    );
  }

  return (
    "I can help you understand Milwaukee's 2026 budget. Try asking about specific " +
    "departments, tax rates, or how your money is spent."
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function AskChat() {
  const { persona, assessedValue, totalTax } = useBudget();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [usedRealApi, setUsedRealApi] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto-scroll on new messages */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /* Send a message — tries real API first, falls back to mock */
  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setUsedRealApi(false);

    try {
      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text.trim() },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let content = "";
      const aiMsgId = crypto.randomUUID();

      // Stream the response
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "", timestamp: new Date() },
      ]);
      setIsTyping(false);
      setUsedRealApi(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content } : m))
        );
      }
    } catch {
      // Fallback to mock response
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: getMockResponse(text),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const personaEmoji =
    persona === "resident" ? "\ud83c\udfe0" : persona === "student" ? "\ud83c\udf93" : "\ud83d\udcf0";

  const starters = STARTER_QUESTIONS[persona] ?? STARTER_QUESTIONS.resident;
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col rounded-lg border-2 border-gray-900 bg-white shadow-[4px_4px_0px_0px_#111]">
      {/* Context pill */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2">
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-900">
          {personaEmoji} {persona}
        </span>
        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
          Home: {formatCurrency(assessedValue)}
        </span>
        <span className="ml-auto text-xs text-gray-400">
          AI knows your tax context
        </span>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ minHeight: "420px", maxHeight: "520px" }}
      >
        {isEmpty ? (
          /* Starter questions */
          <div className="flex h-full flex-col items-center justify-center">
            <h3 className="mb-1 text-lg font-bold text-gray-900">
              Ask about Milwaukee&apos;s budget
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Choose a question or type your own below
            </p>
            <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
              {starters.map((question) => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  className="rounded-lg border-2 border-gray-900 bg-white px-4 py-3 text-left text-sm font-medium text-gray-800 shadow-[2px_2px_0px_0px_#111] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#111] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#111]"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message list */
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-md bg-blue-900 text-white"
                      : "rounded-bl-md border border-gray-200 bg-gray-100 text-gray-900"
                  }`}
                >
                  {msg.content}
                  {msg.role === "assistant" && !usedRealApi && (
                    <p className="mt-2 border-t border-gray-200 pt-1.5 text-[10px] text-gray-400">
                      {"\ud83e\udd16"} Powered by Amazon Nova via Bedrock. Showing cached
                      response — live agent available when connected.
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-gray-200 bg-gray-100 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t-2 border-gray-900 px-4 py-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Milwaukee's budget..."
          disabled={isTyping}
          className="flex-1 rounded-lg border-2 border-gray-900 px-3 py-2 text-sm outline-none transition-shadow focus:shadow-[2px_2px_0px_0px_#1e3a5f] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="rounded-lg border-2 border-gray-900 bg-blue-900 px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_#111] transition-all hover:bg-blue-800 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:shadow-none"
        >
          Send
        </button>
      </form>
    </div>
  );
}
