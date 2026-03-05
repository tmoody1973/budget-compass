"use client";

import { useBudget } from "@/contexts/budget-context";
import { Landing } from "@/components/landing";
import { AppShell } from "@/components/app-shell";

export default function Home() {
  const { isLanded } = useBudget();
  return isLanded ? <AppShell /> : <Landing />;
}
