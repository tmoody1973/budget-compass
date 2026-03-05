"use client";

import { BudgetProvider } from "@/contexts/budget-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <BudgetProvider>{children}</BudgetProvider>;
}
