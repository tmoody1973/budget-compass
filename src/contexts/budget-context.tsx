"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { anyApi } from "convex/server";
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
  const [profileLoaded, setProfileLoaded] = useState(false);

  const { user, isSignedIn } = useUser();
  const convex = useConvex();
  const [wasSignedIn, setWasSignedIn] = useState(false);

  // Reset to landing page on sign out
  useEffect(() => {
    if (isSignedIn) {
      setWasSignedIn(true);
    } else if (wasSignedIn && !isSignedIn) {
      // User just signed out
      setIsLanded(false);
      setAssessedValue(166000);
      setPropertyDetails({});
      setPersona("resident");
      setProfileLoaded(false);
      setWasSignedIn(false);
    }
  }, [isSignedIn, wasSignedIn]);

  // Load saved profile on sign-in
  useEffect(() => {
    if (!isSignedIn || !user?.id || profileLoaded) return;

    async function loadProfile() {
      try {
        const profile = await convex.query(anyApi["userProfiles"]["getProfile"], {
          clerkId: user!.id,
        });

        if (profile) {
          if (profile.assessedValue) setAssessedValue(profile.assessedValue);
          if (profile.persona) setPersona(profile.persona as Persona);
          if (profile.address) {
            setPropertyDetails({
              address: profile.address,
              aldermanicDistrict: profile.aldermanicDistrict ?? undefined,
              policeDistrict: profile.policeDistrict ?? undefined,
              fireStation: profile.fireStation ?? undefined,
            });
            setIsLanded(true);
          }
          setProfileLoaded(true);
        }
      } catch {
        // Profile doesn't exist yet, that's fine
      }
    }

    loadProfile();
  }, [isSignedIn, user?.id, profileLoaded, convex]);

  // Save profile when user data changes (debounced)
  const saveProfile = useCallback(async () => {
    if (!isSignedIn || !user?.id) return;

    try {
      await convex.mutation(anyApi["userProfiles"]["saveProfile"], {
        clerkId: user.id,
        assessedValue,
        address: propertyDetails.address,
        aldermanicDistrict: propertyDetails.aldermanicDistrict,
        policeDistrict: propertyDetails.policeDistrict,
        fireStation: propertyDetails.fireStation,
        persona,
      });
    } catch {
      // Silent fail — don't break the app if save fails
    }
  }, [isSignedIn, user?.id, assessedValue, propertyDetails, persona, convex]);

  // Auto-save when important data changes
  useEffect(() => {
    if (!isSignedIn || !profileLoaded) return;
    const timer = setTimeout(saveProfile, 1000);
    return () => clearTimeout(timer);
  }, [assessedValue, propertyDetails, persona, isSignedIn, profileLoaded, saveProfile]);

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
