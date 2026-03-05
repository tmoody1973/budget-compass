"use client";

import { useState } from "react";
import { useBudget } from "@/contexts/budget-context";
import { useTranslation } from "@/lib/i18n";
import { lookupAddress } from "@/lib/mprop";

const PRESETS = [
  { label: "$100K", value: 100000 },
  { label: "$166K", value: 166000, note: "median" },
  { label: "$200K", value: 200000 },
  { label: "$250K", value: 250000 },
  { label: "$350K", value: 350000 },
];

export function Landing() {
  const { setAssessedValue, setPropertyDetails, setPersona, setIsLanded } = useBudget();
  const { t } = useTranslation();
  const [addressInput, setAddressInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(166000);

  const handleAddressSearch = async () => {
    if (!addressInput.trim()) return;
    setIsSearching(true);
    setError("");

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
    <main className="flex min-h-screen items-center justify-center bg-mke-cream p-4">
      <div className="w-full max-w-lg rounded-xl border-2 border-mke-dark bg-white p-6 shadow-[6px_6px_0px_0px_#1A1A2E] sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-head text-3xl font-bold text-mke-blue">
            {t("landing.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t("landing.subtitle")}
          </p>
        </div>

        {/* Address search */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold text-gray-500">
            {t("landing.addressPlaceholder")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
              placeholder="123 N Water St"
              className="flex-1 rounded-lg border-2 border-mke-dark px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mke-blue"
            />
            <button
              onClick={handleAddressSearch}
              disabled={isSearching}
              className="rounded-lg border-2 border-mke-dark bg-mke-blue px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_#1A1A2E] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#1A1A2E]"
            >
              {isSearching ? "..." : "Look Up"}
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">{t("landing.orChoose")}</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Presets */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              className={`rounded-lg border-2 border-mke-dark px-3 py-2 text-sm font-bold transition-all ${
                selectedPreset === p.value
                  ? "bg-mke-blue text-white shadow-[2px_2px_0px_0px_#1A1A2E]"
                  : "bg-white text-mke-dark shadow-[3px_3px_0px_0px_#1A1A2E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1A1A2E]"
              }`}
            >
              {p.label}
              {p.note && <span className="ml-1 text-xs opacity-70">({p.note})</span>}
            </button>
          ))}
        </div>

        {/* Persona */}
        <div className="mb-6">
          <label className="mb-2 block text-center text-xs font-semibold text-gray-500">
            {t("landing.iAmA")}
          </label>
          <div className="flex justify-center gap-2">
            {([
              { id: "resident", labelKey: "landing.resident", emoji: "\ud83c\udfe0" },
              { id: "student", labelKey: "landing.student", emoji: "\ud83c\udf93" },
              { id: "journalist", labelKey: "landing.journalist", emoji: "\ud83d\udcf0" },
            ] as const).map((p) => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className="rounded-lg border-2 border-mke-dark bg-white px-3 py-2 text-sm font-bold shadow-[2px_2px_0px_0px_#1A1A2E] transition-all hover:bg-mke-cream"
              >
                {p.emoji} {t(p.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Go button */}
        <button
          onClick={handleGo}
          className="w-full rounded-lg border-2 border-mke-dark bg-mke-blue py-3 text-lg font-bold text-white shadow-[4px_4px_0px_0px_#1A1A2E] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A2E]"
        >
          {t("landing.cta")}
        </button>
      </div>
    </main>
  );
}
