import madisonData from "./madison.json";
import madisonSchoolsData from "./madison-schools.json";

export interface ComparisonDepartment {
  name: string;
  category: string;
  budget: number;
  percent_of_total: number;
}

export interface ComparisonRevenueSource {
  source: string;
  amount: number;
}

export interface ComparisonCity {
  city: string;
  state: string;
  fiscal_year: number;
  population: number;
  total_budget: number;
  total_revenue: number | null;
  tax_rate_per_1000: number | null;
  property_tax_levy: number | null;
  departments: ComparisonDepartment[];
  revenue_sources: ComparisonRevenueSource[];
  extracted_from: string;
  extraction_notes: string;
}

export const comparisonCities: ComparisonCity[] = [
  madisonData as ComparisonCity,
  madisonSchoolsData as ComparisonCity,
];

/** Get all comparison cities plus Milwaukee for cross-city analysis */
export function getComparisonSummary(): {
  cities: {
    name: string;
    population: number;
    totalBudget: number;
    taxRate: number | null;
    propertyTaxLevy: number | null;
    topDepartment: string;
    topDepartmentBudget: number;
    topDepartmentPercent: number;
    publicSafetyBudget: number;
    publicSafetyPercent: number;
  }[];
} {
  const cities = comparisonCities.map((city) => {
    const sorted = [...city.departments].sort((a, b) => b.budget - a.budget);
    const publicSafety = city.departments
      .filter((d) => d.category === "public_safety")
      .reduce((sum, d) => sum + d.budget, 0);

    return {
      name: city.city,
      population: city.population,
      totalBudget: city.total_budget,
      taxRate: city.tax_rate_per_1000,
      propertyTaxLevy: city.property_tax_levy,
      topDepartment: sorted[0]?.name ?? "Unknown",
      topDepartmentBudget: sorted[0]?.budget ?? 0,
      topDepartmentPercent: sorted[0]?.percent_of_total ?? 0,
      publicSafetyBudget: publicSafety,
      publicSafetyPercent: city.total_budget > 0
        ? (publicSafety / city.total_budget) * 100
        : 0,
    };
  });

  return { cities };
}
