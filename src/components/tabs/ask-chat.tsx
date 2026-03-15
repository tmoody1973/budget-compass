"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useBudget } from "@/contexts/budget-context";
import madisonData from "../../../data/comparison/madison.json";
import madisonSchoolsData from "../../../data/comparison/madison-schools.json";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ComparisonBudget {
  id: string;
  city: string;
  state: string;
  fiscal_year: number;
  total_budget: number;
  departments: { name: string; category: string; budget: number; percent_of_total: number }[];
  summary?: string;
  source: "pre-loaded" | "uploaded" | "nova-act";
}

/* ------------------------------------------------------------------ */
/* Pre-loaded comparison budgets                                       */
/* ------------------------------------------------------------------ */

const PRE_LOADED_BUDGETS: ComparisonBudget[] = [
  {
    id: "madison",
    city: madisonData.city,
    state: madisonData.state,
    fiscal_year: madisonData.fiscal_year,
    total_budget: madisonData.total_budget,
    departments: madisonData.departments,
    summary: (madisonData as any).extraction_notes,
    source: "pre-loaded",
  },
  {
    id: "madison-schools",
    city: madisonSchoolsData.city,
    state: madisonSchoolsData.state,
    fiscal_year: madisonSchoolsData.fiscal_year,
    total_budget: madisonSchoolsData.total_budget,
    departments: madisonSchoolsData.departments,
    summary: (madisonSchoolsData as any).extraction_notes,
    source: "pre-loaded",
  },
];

/* ------------------------------------------------------------------ */
/* Persona-aware starter questions                                     */
/* ------------------------------------------------------------------ */

const STARTER_QUESTIONS: Record<string, string[]> = {
  resident: [
    "How much of my tax goes to police and fire?",
    "Why did my property tax bill go up this year?",
    "What services does the city provide for my neighborhood?",
    "How does Milwaukee compare to Madison on police spending?",
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
    "Compare Milwaukee and Madison's budget priorities",
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
      "receives about $307M and the Fire Department about $137M annually.\n\n" +
      "**Want to explore further?**\n" +
      "- How does Milwaukee's police spending compare to Madison?\n" +
      "- What percentage of the budget goes to fire vs EMS?\n" +
      "- How has public safety spending changed over the last 5 years?"
    );
  }

  if (q.includes("compare") || q.includes("madison")) {
    return (
      "Milwaukee spends about $310M on police (22% of its general fund), while Madison spends " +
      "$96M (22% of its budget). Per capita, Milwaukee spends about $527 on police vs Madison's " +
      "$356. Upload another city's budget PDF to expand the comparison."
    );
  }

  return (
    "I can help you understand Milwaukee's 2026 budget. Try asking about specific " +
    "departments, tax rates, or how your money is spent."
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\n)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) return <strong key={i}>{boldMatch[1]}</strong>;
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch)
      return (
        <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
          className="font-medium text-blue-700 underline hover:text-blue-900">
          {linkMatch[1]}
        </a>
      );
    if (part === "\n") return <br key={i} />;
    return part;
  });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AskChat() {
  const { persona, assessedValue, totalTax } = useBudget();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [usedRealApi, setUsedRealApi] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comparison budgets state
  const [availableBudgets, setAvailableBudgets] = useState<ComparisonBudget[]>(PRE_LOADED_BUDGETS);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedBudget = availableBudgets.find((b) => b.id === selectedBudgetId) ?? null;

  // Nova Act search state
  const [searchCity, setSearchCity] = useState("");
  const [isSearchingBudget, setIsSearchingBudget] = useState(false);
  const [searchSteps, setSearchSteps] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<{ title: string; url: string; source_page: string; file_type: string }[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  /* Auto-scroll on new messages */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /* Handle PDF upload */
  const handleUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please upload a PDF file.");
      return;
    }
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/analyze-budget", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Failed to analyze PDF");
        return;
      }

      const result = data.result;
      const newBudget: ComparisonBudget = {
        id: result.id ?? `upload-${Date.now()}`,
        city: result.city ?? file.name.replace(".pdf", ""),
        state: result.state ?? "??",
        fiscal_year: result.fiscal_year ?? 2025,
        total_budget: result.total_budget ?? 0,
        departments: result.departments ?? [],
        summary: result.summary,
        source: "uploaded",
      };

      setAvailableBudgets((prev) => [...prev, newBudget]);
      setSelectedBudgetId(newBudget.id);

      // Add a system message about the upload
      const sysMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `I've analyzed **${newBudget.city}**'s budget (${newBudget.fiscal_year}). Total budget: **${formatCurrency(newBudget.total_budget)}** with ${newBudget.departments.length} departments extracted.\n\n${newBudget.summary ?? ""}\n\nYou can now ask me to compare Milwaukee with ${newBudget.city}. Try: "How does Milwaukee's spending compare to ${newBudget.city}?"`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, sysMsg]);
      setUsedRealApi(true);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  /* Nova Act budget search */
  const handleBudgetSearch = useCallback(async () => {
    if (!searchCity.trim()) return;
    setIsSearchingBudget(true);
    setSearchError(null);
    setSearchResults([]);
    setSearchSteps(["Starting Nova Act search..."]);

    const parts = searchCity.split(",").map((s) => s.trim());
    const city = parts[0] ?? searchCity;
    const state = parts[1] ?? "WI";

    try {
      const res = await fetch("/api/find-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, state }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error ?? "Search failed");
        return;
      }

      setSearchSteps(data.search_steps ?? []);
      setSearchResults(data.results ?? []);

      if (!data.results?.length) {
        setSearchError(`No budget documents found for ${city}, ${state}. Try a different city name.`);
      }
    } catch {
      setSearchError("Could not reach the budget finder service.");
    } finally {
      setIsSearchingBudget(false);
    }
  }, [searchCity]);

  /* Analyze a PDF from a URL (Nova Act found it) */
  const handleAnalyzeUrl = useCallback(async (url: string, title: string) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("url", url);

      const res = await fetch("/api/analyze-budget", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Failed to analyze PDF");
        return;
      }

      const result = data.result;
      const newBudget: ComparisonBudget = {
        id: result.id ?? `nova-act-${Date.now()}`,
        city: result.city ?? title,
        state: result.state ?? "??",
        fiscal_year: result.fiscal_year ?? 2025,
        total_budget: result.total_budget ?? 0,
        departments: result.departments ?? [],
        summary: result.summary,
        source: "nova-act",
      };

      setAvailableBudgets((prev) => [...prev, newBudget]);
      setSelectedBudgetId(newBudget.id);
      setSearchResults([]);
      setSearchCity("");

      const sysMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Nova found and analyzed **${newBudget.city}**'s budget (${newBudget.fiscal_year}). Total: **${formatCurrency(newBudget.total_budget)}** with ${newBudget.departments.length} departments.\n\n${newBudget.summary ?? ""}\n\nTry: "How does Milwaukee compare to ${newBudget.city}?"`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, sysMsg]);
      setUsedRealApi(true);
    } catch {
      setUploadError("Failed to analyze the PDF. Try uploading manually.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  /* Drag and drop handlers */
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  /* Send a message */
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

    // Build comparison context if a budget is selected
    let comparisonContext = "";
    if (selectedBudget) {
      const deptList = selectedBudget.departments
        .slice(0, 8)
        .map((d) => `${d.name}: $${(d.budget / 1_000_000).toFixed(1)}M (${d.percent_of_total}%)`)
        .join(", ");
      comparisonContext = `\n\n[COMPARISON CONTEXT: The user has selected ${selectedBudget.city}, ${selectedBudget.state} (FY${selectedBudget.fiscal_year}) for comparison. Total budget: $${(selectedBudget.total_budget / 1_000_000).toFixed(0)}M. Departments: ${deptList}. Use this data when the user asks comparison questions. This data was extracted from an official budget PDF using Nova 2 Lite document understanding.]`;
    }

    try {
      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text.trim() + comparisonContext },
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
    <div
      className="flex flex-col rounded-lg border-2 border-gray-900 bg-white shadow-[4px_4px_0px_0px_#111]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top bar: context + budget selector */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-gray-900 px-4 py-2.5">
        <span className="border-2 border-black bg-blue-100 px-2 py-0.5 text-sm font-bold text-blue-900">
          {personaEmoji} {persona}
        </span>
        <span className="border-2 border-black bg-gray-100 px-2 py-0.5 text-sm font-bold text-gray-600">
          {formatCurrency(assessedValue)}
        </span>

        {/* Budget comparison dropdown */}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500">Compare with:</label>
          <select
            value={selectedBudgetId ?? ""}
            onChange={(e) => setSelectedBudgetId(e.target.value || null)}
            className="border-2 border-black bg-white px-2 py-1 text-sm font-bold shadow-[2px_2px_0px_0px_#111] focus:outline-none"
          >
            <option value="">None</option>
            {availableBudgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.city}, {b.state} ({b.fiscal_year})
                {b.source === "uploaded" ? " \u2b50" : ""}
              </option>
            ))}
          </select>

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="border-2 border-black bg-green-200 px-2 py-1 text-sm font-bold shadow-[2px_2px_0px_0px_#111] transition-all hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#111] disabled:opacity-50"
          >
            {isUploading ? "Analyzing..." : "+ Upload PDF"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Nova Act budget search */}
      <div className="flex items-center gap-2 border-b-2 border-gray-900 px-4 py-2">
        <input
          type="text"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleBudgetSearch(); }}
          placeholder="Find a city's budget (e.g., Green Bay, WI)"
          disabled={isSearchingBudget}
          className="flex-1 border-2 border-black px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mke-blue disabled:opacity-50"
        />
        <button
          onClick={handleBudgetSearch}
          disabled={isSearchingBudget || !searchCity.trim()}
          className="border-2 border-black bg-purple-200 px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0px_0px_#111] transition-all hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#111] disabled:opacity-50"
        >
          {isSearchingBudget ? "Searching..." : "Find Budget"}
        </button>
      </div>

      {/* Search progress steps */}
      {isSearchingBudget && searchSteps.length > 0 && (
        <div className="border-b border-purple-200 bg-purple-50 px-4 py-2">
          {searchSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-purple-800">
              <span>{i === searchSteps.length - 1 ? "\u23f3" : "\u2713"}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && !isSearchingBudget && (
        <div className="border-b-2 border-gray-900 bg-green-50 px-4 py-2">
          <p className="mb-2 text-sm font-bold text-green-800">
            Found {searchResults.length} budget document{searchResults.length !== 1 ? "s" : ""}:
          </p>
          {searchResults.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-2 py-1.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.title}</p>
                <p className="truncate text-xs text-gray-500">{r.source_page}</p>
              </div>
              <button
                onClick={() => handleAnalyzeUrl(r.url, r.title)}
                disabled={isUploading}
                className="shrink-0 border-2 border-black bg-green-200 px-3 py-1 text-sm font-bold shadow-[2px_2px_0px_0px_#111] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#111] disabled:opacity-50"
              >
                {isUploading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search error */}
      {searchError && (
        <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>{searchError}</span>
          <button onClick={() => setSearchError(null)} className="font-bold hover:text-red-900">x</button>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="font-bold hover:text-red-900">x</button>
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="flex items-center justify-center border-4 border-dashed border-mke-blue bg-blue-50 py-12 text-lg font-bold text-mke-blue">
          Drop a budget PDF here — Nova will read it
        </div>
      )}

      {/* Selected comparison badge */}
      {selectedBudget && !isDragging && (
        <div className="flex items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2">
          <span className="text-sm font-bold text-blue-800">
            Comparing with: {selectedBudget.city} ({formatCurrency(selectedBudget.total_budget)} budget)
          </span>
          <button
            onClick={() => setSelectedBudgetId(null)}
            className="text-xs font-bold text-blue-500 hover:text-blue-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ minHeight: "380px", maxHeight: "480px" }}
      >
        {isEmpty && !isDragging ? (
          <div className="flex h-full flex-col items-center justify-center">
            <h3 className="mb-1 text-xl font-black text-gray-900">
              Ask about Milwaukee&apos;s budget
            </h3>
            <p className="mb-4 text-base text-gray-500">
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

            {/* Upload prompt */}
            <div className="mt-6 w-full max-w-lg">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-400 bg-gray-50 px-4 py-4 text-base font-bold text-gray-500 transition-all hover:border-mke-blue hover:bg-blue-50 hover:text-mke-blue"
              >
                {isUploading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-mke-blue border-t-transparent" />
                    Nova is reading the PDF...
                  </>
                ) : (
                  <>
                    Upload a city budget PDF to compare
                  </>
                )}
              </button>
            </div>
          </div>
        ) : !isDragging ? (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-base leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-md bg-mke-blue text-white"
                      : "rounded-bl-md border-2 border-gray-200 bg-gray-50 text-gray-900"
                  }`}
                >
                  {msg.role === "assistant"
                    ? renderMarkdown(msg.content)
                    : msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border-2 border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-mke-blue [animation-delay:0ms]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-mke-blue [animation-delay:150ms]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-mke-blue [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
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
          placeholder={selectedBudget ? `Compare Milwaukee with ${selectedBudget.city}...` : "Ask about Milwaukee's budget..."}
          disabled={isTyping}
          className="flex-1 border-2 border-gray-900 px-4 py-2.5 text-base outline-none transition-shadow focus:shadow-[2px_2px_0px_0px_#0A3161] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="border-2 border-gray-900 bg-mke-blue px-5 py-2.5 text-base font-bold text-white shadow-[2px_2px_0px_0px_#111] transition-all hover:bg-blue-800 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:shadow-none"
        >
          Send
        </button>
      </form>
    </div>
  );
}
