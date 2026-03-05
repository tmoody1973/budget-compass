"use client";

import { useState } from "react";
import { useBudget } from "@/contexts/budget-context";
import { useTranslation } from "@/lib/i18n";
import { TaxReceipt } from "@/components/tabs/tax-receipt";
import { ExploreBudgets } from "@/components/tabs/explore-budgets";
import { BudgetSimulator } from "@/components/tabs/budget-simulator";
import { AskChat } from "@/components/tabs/ask-chat";
import { VoicePanel } from "@/components/voice-panel";

type Tab = "receipt" | "explore" | "simulate" | "ask";

const TAB_ICONS: Record<Tab, string> = {
  receipt: "\ud83e\uddfe",
  explore: "\ud83d\uddfa\ufe0f",
  simulate: "\ud83c\udf9b\ufe0f",
  ask: "\ud83d\udcac",
};

const TAB_KEYS: { id: Tab; labelKey: string }[] = [
  { id: "receipt", labelKey: "tab.receipt" },
  { id: "explore", labelKey: "tab.explore" },
  { id: "simulate", labelKey: "tab.simulate" },
  { id: "ask", labelKey: "tab.ask" },
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b-2 border-gray-900 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button
            onClick={() => setIsLanded(false)}
            className="font-bold text-xl text-blue-900 hover:opacity-80"
          >
            MKE Budget Compass
          </button>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded border border-gray-300 px-2 py-1 text-xs font-medium">
              {persona === "resident" ? "\ud83c\udfe0" : persona === "student" ? "\ud83c\udf93" : "\ud83d\udcf0"} {persona}
            </span>
            <span className="rounded border border-gray-300 px-2 py-1 text-xs font-medium">
              {t("common.home")}: {formatCurrency(assessedValue)}
            </span>
            <span className="rounded border border-gray-300 px-2 py-1 text-xs font-bold text-blue-900">
              {t("common.tax")}: ${totalTax.toFixed(0)}/yr
            </span>
            <button
              onClick={() => setLanguage(language === "en" ? "es" : "en")}
              className="rounded border-2 border-gray-900 px-2 py-1 text-xs font-bold shadow-[1px_1px_0px_0px_#111] hover:bg-gray-100"
            >
              {language === "en" ? "ES" : "EN"}
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="border-b-2 border-gray-900 bg-white">
        <div className="mx-auto flex max-w-6xl">
          {TAB_KEYS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 border-r border-gray-200 px-4 py-3 text-center text-sm font-bold transition-colors last:border-r-0 ${
                activeTab === tab.id
                  ? "bg-blue-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-1">{TAB_ICONS[tab.id]}</span>
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl p-4">
          {activeTab === "receipt" && <TaxReceipt />}
          {activeTab === "explore" && <ExploreBudgets />}
          {activeTab === "simulate" && <BudgetSimulator />}
          {activeTab === "ask" && <AskChat />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-3 text-center text-xs text-gray-400">
        {t("common.footer")}{" "}
        &middot;{" "}
        <a
          href="/methodology"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {t("common.dataSource")} &rarr;
        </a>
      </footer>

      {/* Voice interaction panel — floats independently */}
      <VoicePanel />
    </div>
  );
}
