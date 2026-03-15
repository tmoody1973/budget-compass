"use client";

import { useState } from "react";
import { useBudget } from "@/contexts/budget-context";
import { useTranslation } from "@/lib/i18n";
import { TaxReceipt } from "@/components/tabs/tax-receipt";
import { ExploreBudgets } from "@/components/tabs/explore-budgets";
import { BudgetSimulator } from "@/components/tabs/budget-simulator";
import { AskChat } from "@/components/tabs/ask-chat";
import { Budget101 } from "@/components/budget-101";

type Tab = "receipt" | "explore" | "simulate" | "ask" | "learn";

const TABS: { id: Tab; icon: string; label: string; desc: string }[] = [
  { id: "receipt", icon: "\ud83e\uddfe", label: "Tax Receipt", desc: "Your breakdown" },
  { id: "explore", icon: "\ud83d\uddfa\ufe0f", label: "Explore", desc: "Interactive budgets" },
  { id: "simulate", icon: "\ud83c\udf9b\ufe0f", label: "Remix", desc: "What-if scenarios" },
  { id: "ask", icon: "\ud83d\udcac", label: "Ask", desc: "Chat with the budget" },
  { id: "learn", icon: "\ud83c\udf93", label: "Budget 101", desc: "Guided tour" },
];

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("receipt");
  const { assessedValue, totalTax, persona, language, setLanguage, setIsLanded } = useBudget();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-mke-cream">
      {/* Header */}
      <header className="border-b-4 border-black bg-mke-blue px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button
            onClick={() => setIsLanded(false)}
            className="font-head text-2xl font-black text-white hover:opacity-90"
          >
            Budget Compass
          </button>
          <div className="flex items-center gap-3">
            <span className="border-2 border-white/30 bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
              {persona === "resident" ? "\ud83c\udfe0" : persona === "student" ? "\ud83c\udf93" : "\ud83d\udcf0"} {persona}
            </span>
            <span className="border-2 border-white/30 bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
              {formatCurrency(assessedValue)}
            </span>
            <span className="border-2 border-white bg-white px-3 py-1.5 text-sm font-black text-mke-blue">
              ${totalTax.toFixed(0)}/yr
            </span>
            <button
              onClick={() => setLanguage(language === "en" ? "es" : "en")}
              className="border-2 border-white bg-transparent px-3 py-1.5 text-sm font-bold text-white hover:bg-white/10"
            >
              {language === "en" ? "ES" : "EN"}
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="border-b-4 border-black bg-white">
        <div className="mx-auto flex max-w-6xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 border-r-2 border-black px-4 py-3 text-center transition-colors last:border-r-0 ${
                activeTab === tab.id
                  ? "bg-mke-dark text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="ml-2 text-base font-black">{tab.label}</span>
              <span className={`ml-1 hidden text-sm sm:inline ${
                activeTab === tab.id ? "text-white/70" : "text-gray-400"
              }`}>
                {tab.desc}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">
          {activeTab === "receipt" && <TaxReceipt />}
          {activeTab === "explore" && <ExploreBudgets />}
          {activeTab === "simulate" && <BudgetSimulator />}
          {activeTab === "ask" && <AskChat />}
          {activeTab === "learn" && <Budget101 />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-mke-dark py-4 text-center text-sm text-white/60">
        {t("common.footer")}{" "}
        &middot; Powered by Amazon Nova 2 Lite on Bedrock &middot;{" "}
        <a
          href="/methodology"
          className="text-white/80 hover:text-white hover:underline"
        >
          {t("common.dataSource")} &rarr;
        </a>
      </footer>
    </div>
  );
}
