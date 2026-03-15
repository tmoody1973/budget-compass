"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useBudget } from "@/contexts/budget-context";
import { useTranslation } from "@/lib/i18n";
import { lookupAddress, searchAddresses, type MpropProperty } from "@/lib/mprop";
import { Button } from "@/components/retroui/Button";

const PRESETS = [
  { label: "$100K", value: 100000 },
  { label: "$166K", value: 166000, note: "median" },
  { label: "$200K", value: 200000 },
  { label: "$250K", value: 250000 },
  { label: "$350K", value: 350000 },
];

const FEATURE_CARDS = [
  {
    id: 1,
    title: "Your Tax Receipt",
    description: "See exactly where every dollar of your property tax goes.",
    icon: "\ud83e\uddfe",
    color: "bg-blue-200",
    expandedContent:
      "Enter your Milwaukee address and get a personalized breakdown of your property tax across City, County, MPS, and other jurisdictions. Each line item explains what you're paying for in plain language.",
  },
  {
    id: 2,
    title: "Ask the Budget",
    description: "Chat with 8 AI agents that know every number.",
    icon: "\ud83d\udcac",
    color: "bg-green-200",
    expandedContent:
      "Ask anything about Milwaukee's $1.7 billion budget. Our query router sends your question to the right specialist -- Q&A, analyst, simulator, or visual agent. Every answer comes from verified budget data, never estimated.",
  },
  {
    id: 3,
    title: "Explore & Compare",
    description: "Interactive treemaps across City, County, and MPS.",
    icon: "\ud83d\uddfa\ufe0f",
    color: "bg-yellow-200",
    expandedContent:
      "Drill down from the full $3.9 billion combined budget to individual departments. See how much of YOUR tax goes to each service. Compare Milwaukee's spending to other Wisconsin cities.",
  },
  {
    id: 4,
    title: "Budget Remix",
    description: "What if you could redesign the budget?",
    icon: "\ud83c\udf9b\ufe0f",
    color: "bg-purple-200",
    expandedContent:
      "Drag sliders to reallocate spending across Public Safety, Infrastructure, Community Services, and Government Operations. See how your changes affect your personal tax bill in real time.",
  },
  {
    id: 5,
    title: "Budget 101",
    description: "Guided tour for first-time budget explorers.",
    icon: "\ud83c\udf93",
    color: "bg-pink-200",
    expandedContent:
      "New to city budgets? Our AI walks you through the basics step by step -- what the city spends, where your money goes, how schools are funded, and what it all means for your neighborhood.",
  },
];

export function Landing() {
  const { setAssessedValue, setPropertyDetails, setPersona, persona, setIsLanded } = useBudget();
  const { t } = useTranslation();
  const [addressInput, setAddressInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(166000);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<MpropProperty[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddresses(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsLoadingSuggestions(false);
    }, 300);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setExpandedId(null);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddressInput(val);
    setError("");
    fetchSuggestions(val);
  };

  const handleSelectSuggestion = (property: MpropProperty) => {
    setAssessedValue(property.assessedValue);
    setPropertyDetails({
      address: property.address,
      aldermanicDistrict: property.aldermanicDistrict,
      policeDistrict: property.policeDistrict,
      fireStation: property.fireStation,
    });
    setAddressInput(property.address);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLanded(true);
  };

  const handleAddressSearch = async () => {
    if (!addressInput.trim()) return;
    setIsSearching(true);
    setError("");
    setShowSuggestions(false);
    const result = await lookupAddress(addressInput);
    if (result && result.assessedValue > 0) {
      setAssessedValue(result.assessedValue);
      setPropertyDetails({
        address: result.address,
        aldermanicDistrict: result.aldermanicDistrict,
        policeDistrict: result.policeDistrict,
        fireStation: result.fireStation,
      });
      setIsLanded(true);
    } else {
      setError("Address not found. Try a different format or use a preset value.");
    }
    setIsSearching(false);
  };

  const handlePreset = (value: number) => {
    setSelectedPreset(value);
    setAssessedValue(value);
  };

  const handleGo = () => {
    if (selectedPreset) {
      setAssessedValue(selectedPreset);
    }
    setIsLanded(true);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Hero Text */}
          <div>
            <span className="mb-6 inline-block rounded-none border-2 border-black bg-mke-blue px-3 py-1 text-sm font-bold text-white shadow-[2px_2px_0px_0px_black]">
              Amazon Nova AI Hackathon 2026
            </span>

            <h1 className="font-head text-5xl sm:text-6xl font-black leading-tight mb-6 text-mke-dark">
              Know Where Your{" "}
              <span className="bg-mke-blue px-2 border-4 border-black text-white">
                Tax Dollars
              </span>{" "}
              Go
            </h1>

            <p className="text-lg text-gray-600 font-medium border-l-4 border-black pl-4 mb-8">
              Milwaukee spends $1.7 billion a year. Enter your address and see
              your personal tax receipt -- every department, every dollar,
              powered by 8 Amazon Nova AI agents.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="rounded-none border-2 border-black bg-gray-100 px-3 py-1.5 text-xs font-bold">
                Powered by Amazon Nova 2 Lite
              </span>
              <span className="rounded-none border-2 border-black bg-gray-100 px-3 py-1.5 text-xs font-bold">
                Zero hallucinated numbers
              </span>
              <span className="rounded-none border-2 border-black bg-gray-100 px-3 py-1.5 text-xs font-bold">
                8 specialized agents
              </span>
            </div>
          </div>

          {/* Right Column - Address Input Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-mke-blue transform translate-x-3 translate-y-3" />
            <div className="relative border-4 border-black bg-white p-6 sm:p-8">
              {/* Address search */}
              <div className="relative mb-5" ref={dropdownRef}>
                <label className="mb-2 block text-base font-black text-mke-dark">
                  Enter your Milwaukee address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setShowSuggestions(false);
                        handleAddressSearch();
                      }
                    }}
                    placeholder="123 N Water St"
                    className="flex-1 border-2 border-black px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-mke-blue"
                  />
                  <Button
                    onClick={handleAddressSearch}
                    disabled={isSearching}
                    size="lg"
                    className="bg-black text-white shadow-[3px_3px_0px_0px_#2563eb]"
                  >
                    {isSearching ? "..." : "Look Up"}
                  </Button>
                </div>

                {/* Autocomplete dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto border-2 border-black bg-white shadow-[4px_4px_0px_0px_black]">
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s.address}-${i}`}
                        onClick={() => handleSelectSuggestion(s)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-blue-50"
                      >
                        <span className="text-base font-medium">{s.address}</span>
                        <span className="ml-3 shrink-0 text-sm font-bold text-mke-blue">
                          ${s.assessedValue.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {isLoadingSuggestions && addressInput.trim().length >= 4 && !showSuggestions && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-400">
                    Searching...
                  </div>
                )}

                {error && <p className="mt-2 text-sm font-medium text-red-500">{error}</p>}
              </div>

              {/* Divider */}
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-sm font-bold text-gray-400">or pick a value</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Presets */}
              <div className="mb-5 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handlePreset(p.value)}
                    className={`border-2 border-black px-4 py-2 text-base font-bold transition-all ${
                      selectedPreset === p.value
                        ? "bg-mke-blue text-white shadow-[2px_2px_0px_0px_black]"
                        : "bg-white text-black shadow-[3px_3px_0px_0px_black] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_black]"
                    }`}
                  >
                    {p.label}
                    {p.note && <span className="ml-1 text-sm opacity-70">({p.note})</span>}
                  </button>
                ))}
              </div>

              {/* Persona */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-black text-mke-dark">I am a...</label>
                <div className="flex gap-2">
                  {([
                    { id: "resident", label: "Resident", emoji: "\ud83c\udfe0" },
                    { id: "student", label: "Student", emoji: "\ud83c\udf93" },
                    { id: "journalist", label: "Journalist", emoji: "\ud83d\udcf0" },
                  ] as const).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPersona(p.id)}
                      className={`flex-1 border-2 border-black px-3 py-2 text-base font-bold transition-all ${
                        persona === p.id
                          ? "bg-green-200 shadow-[2px_2px_0px_0px_black]"
                          : "bg-white shadow-[3px_3px_0px_0px_black] hover:bg-gray-50"
                      }`}
                    >
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Go button */}
              <Button
                onClick={handleGo}
                size="lg"
                className="w-full bg-black text-white shadow-[4px_4px_0px_0px_#2563eb] text-xl font-black py-4 justify-center"
              >
                See My Tax Breakdown &rarr;
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Features */}
      <section className="py-12 px-4 bg-mke-cream relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-head text-3xl font-black text-mke-dark mb-8 text-center">
            What can Budget Compass do?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURE_CARDS.map((item, index) => (
              <motion.div
                key={item.id}
                layoutId={`bento-${item.id}`}
                className={`${item.color} p-6 border-4 border-black shadow-[4px_4px_0px_0px_black] cursor-pointer overflow-hidden relative ${
                  index === 0 ? "col-span-1 md:col-span-2 row-span-1" : ""
                }`}
                onClick={() => setExpandedId(item.id)}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="relative">
                  {index === 0 && (
                    <div className="absolute -top-32 -right-28 w-60 h-60 border-[16px] border-black/15 bg-transparent rounded-full" />
                  )}

                  <motion.div
                    layoutId={`bento-icon-${item.id}`}
                    className="mb-4 bg-white p-3 inline-block border-2 border-black text-3xl"
                  >
                    {item.icon}
                  </motion.div>

                  <motion.h3
                    layoutId={`bento-title-${item.id}`}
                    className="text-2xl font-black mb-2"
                  >
                    {item.title}
                  </motion.h3>

                  <p
                    className="font-medium text-base text-gray-700 border-l-4 border-black pl-3"
                  >
                    {item.description}
                  </p>
                </div>

                <div className="absolute bottom-3 right-3 flex space-x-1">
                  <div className="w-2 h-2 bg-black rounded-full" />
                  <div className="w-2 h-2 bg-black rounded-full" />
                  <div className="w-2 h-2 bg-black rounded-full" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Expanded card overlay */}
        <AnimatePresence>
          {expandedId && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-10"
                onClick={() => setExpandedId(null)}
              />
              <motion.div
                layoutId={`bento-${expandedId}`}
                className={`${FEATURE_CARDS.find((c) => c.id === expandedId)?.color} fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-8 border-4 border-black shadow-[8px_8px_0px_0px_black] z-20 w-11/12 max-w-2xl overflow-hidden`}
              >
                <div className="relative z-10">
                  <motion.div
                    layoutId={`bento-icon-${expandedId}`}
                    className="mb-4 bg-white p-4 inline-block border-2 border-black text-4xl"
                  >
                    {FEATURE_CARDS.find((c) => c.id === expandedId)?.icon}
                  </motion.div>
                  <motion.h3
                    layoutId={`bento-title-${expandedId}`}
                    className="text-3xl font-black mb-4"
                  >
                    {FEATURE_CARDS.find((c) => c.id === expandedId)?.title}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-lg mb-4 border-l-4 border-black pl-4"
                  >
                    {FEATURE_CARDS.find((c) => c.id === expandedId)?.expandedContent}
                  </motion.p>
                  <motion.button
                    className="absolute top-0 right-0 bg-white p-2 border-2 border-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(null);
                    }}
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </section>

      {/* Bottom tech bar */}
      <div className="border-t-4 border-black bg-mke-dark py-6 text-center">
        <p className="text-white text-sm font-medium">
          Built with Amazon Nova 2 Lite on Bedrock &middot; Mastra Agent Framework &middot; CopilotKit &middot; Next.js &middot; Convex
        </p>
      </div>
    </main>
  );
}
