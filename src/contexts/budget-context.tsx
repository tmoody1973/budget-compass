"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import taxRatesData from "../../data/tax-rates-2026.json";

type Persona = "resident" | "student" | "journalist";
type Language = "en" | "es";

interface PropertyDetails {
  address?: string;
  aldermanicDistrict?: string;
  policeDistrict?: string;
  fireStation?: string;
}

interface TaxJurisdiction {
  id: string;
  name: string;
  shortName: string;
  rate: number;
  source: string;
  icon: string;
  color: string;
  desc: string;
  detail: string;
  yourShare: number;
  pct: number;
  monthly: number;
  daily: number;
}

interface BudgetContextType {
  assessedValue: number;
  setAssessedValue: (value: number) => void;
  persona: Persona;
  setPersona: (persona: Persona) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  propertyDetails: PropertyDetails;
  setPropertyDetails: (details: PropertyDetails) => void;
  isLanded: boolean;
  setIsLanded: (landed: boolean) => void;
  totalTax: number;
  jurisdictions: TaxJurisdiction[];
  grossRate: number;
  netRate: number;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [assessedValue, setAssessedValue] = useState(166000);
  const [persona, setPersona] = useState<Persona>("resident");
  const [language, setLanguage] = useState<Language>("en");
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({});
  const [isLanded, setIsLanded] = useState(false);

  const grossRate = taxRatesData.grossRate;
  const netRate = taxRatesData.netRate;
  const totalTax = (assessedValue / 1000) * grossRate;

  const jurisdictions: TaxJurisdiction[] = taxRatesData.jurisdictions.map(
    (j: any) => {
      const yourShare = (assessedValue / 1000) * j.rate;
      return {
        id: j.id,
        name: j.name,
        shortName: j.shortName,
        rate: j.rate,
        source: j.source,
        icon: j.icon,
        color: j.color,
        desc: j.desc,
        detail: j.detail,
        yourShare,
        pct: (j.rate / grossRate) * 100,
        monthly: yourShare / 12,
        daily: yourShare / 365,
      };
    }
  );

  return (
    <BudgetContext.Provider
      value={{
        assessedValue,
        setAssessedValue,
        persona,
        setPersona,
        language,
        setLanguage,
        propertyDetails,
        setPropertyDetails,
        isLanded,
        setIsLanded,
        totalTax,
        jurisdictions,
        grossRate,
        netRate,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
