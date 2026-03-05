/**
 * Seed script for MKE Budget Compass
 *
 * Reads convex_seed_data.json and department_narratives.json,
 * transforms snake_case fields to camelCase, and inserts data
 * into Convex via mutations in batches.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires CONVEX_URL in .env.local (or as environment variable).
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL not set in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// ---- Helpers ----

/** Convert snake_case key to camelCase */
function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/** Transform all keys in an object from snake_case to camelCase, stripping nulls */
function transformKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Convex treats null and undefined differently — strip nulls for optional fields
    if (value !== null) {
      result[snakeToCamel(key)] = value;
    }
  }
  return result;
}

/** Insert rows in batches with a delay to avoid rate limits */
async function insertBatch<T>(
  rows: T[],
  insertFn: (row: T) => Promise<unknown>,
  label: string,
  batchSize = 25,
) {
  console.log(`  Inserting ${rows.length} rows into ${label}...`);
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await Promise.all(batch.map(insertFn));
    const progress = Math.min(i + batchSize, rows.length);
    process.stdout.write(`    ${progress}/${rows.length}\r`);
  }
  console.log(`  Done: ${rows.length} rows in ${label}`);
}

// ---- Table name to clear/insert mapping ----

const ALL_TABLES = [
  "cityOverview",
  "budgetSections",
  "appropriationDetails",
  "departmentBudgets",
  "departmentMeta",
  "departmentServices",
  "performanceMeasures",
  "positions",
  "historicalComparison",
  "departmentNarratives",
] as const;

// Map from JSON key (snake_case) to Convex table name (camelCase)
const JSON_KEY_TO_TABLE: Record<string, string> = {
  budget_sections: "budgetSections",
  appropriation_details: "appropriationDetails",
  department_budgets: "departmentBudgets",
  department_meta: "departmentMeta",
  department_services: "departmentServices",
  performance_measures: "performanceMeasures",
  positions: "positions",
  historical_comparison: "historicalComparison",
  city_overview: "cityOverview",
};

async function main() {
  console.log("MKE Budget Compass - Seed Script");
  console.log(`Convex URL: ${CONVEX_URL}`);
  console.log("");

  // Step 1: Read data files
  const seedDataPath = path.resolve(__dirname, "../convex_seed_data.json");
  const narrativesPath = path.resolve(__dirname, "../department_narratives.json");

  const seedData = JSON.parse(fs.readFileSync(seedDataPath, "utf-8"));
  const narrativesRaw: Array<Record<string, unknown>> = JSON.parse(
    fs.readFileSync(narrativesPath, "utf-8"),
  );

  // Step 2: Clear all tables
  console.log("Clearing existing data...");
  for (const table of ALL_TABLES) {
    const result = await client.mutation(api.seed.clearTable, { table });
    if (result.deleted > 0) {
      console.log(`  Cleared ${result.deleted} rows from ${table}`);
    }
  }
  console.log("");

  // Step 3: Seed city overview (single object, not array)
  console.log("Seeding tables...");
  const cityOverview = transformKeys(seedData.city_overview) as Record<string, unknown>;
  // Only keep fields that match the schema
  await client.mutation(api.seed.insertCityOverview, {
    city: cityOverview.city as string,
    state: cityOverview.state as string,
    fiscalYear: cityOverview.fiscalYear as number,
    budgetType: cityOverview.budgetType as string,
    mayor: cityOverview.mayor as string,
    totalBudget: cityOverview.totalBudget as number,
    totalTaxLevy: cityOverview.totalTaxLevy as number,
    totalNonTaxLevy: cityOverview.totalNonTaxLevy as number,
    propertyTaxRatePer1000: cityOverview.propertyTaxRatePer1000 as number,
    priorYearTaxRate: cityOverview.priorYearTaxRate as number,
    taxRateChange: cityOverview.taxRateChange as number,
    assessedValue: cityOverview.assessedValue as number,
  });
  console.log("  Done: 1 row in cityOverview");

  // Step 4: Seed budget sections
  const budgetSections = (seedData.budget_sections as Array<Record<string, unknown>>).map(
    (row) => {
      const t = transformKeys(row);
      return {
        section: t.section as string,
        name: t.name as string,
        budget2025Adopted: t.budget2025Adopted as number,
        budget2026Proposed: t.budget2026Proposed as number,
        budgetChange: t.budgetChange as number,
        nonTaxLevy2025: t.nonTaxLevy2025 as number,
        nonTaxLevy2026: t.nonTaxLevy2026 as number,
        taxLevy2025: t.taxLevy2025 as number,
        taxLevy2026: t.taxLevy2026 as number,
        taxLevyChange: t.taxLevyChange as number,
        taxRate2025: t.taxRate2025 as number,
        taxRate2026: t.taxRate2026 as number,
      };
    },
  );
  await insertBatch(
    budgetSections,
    (row) => client.mutation(api.seed.insertBudgetSection, row),
    "budgetSections",
  );

  // Step 5: Seed appropriation details
  const appropriationDetails = (
    seedData.appropriation_details as Array<Record<string, unknown>>
  ).map((row) => {
    const t = transformKeys(row);
    return {
      section: t.section as string,
      sectionName: t.sectionName as string,
      subsection: t.subsection as string,
      lineItem: t.lineItem as string,
      adopted2025: t.adopted2025 as number | undefined,
      requested2026: t.requested2026 as number | undefined,
      proposed2026: t.proposed2026 as number | undefined,
      changeVs2025: t.changeVs2025 as number | undefined,
      changeVsRequested: t.changeVsRequested as number | undefined,
    };
  });
  await insertBatch(
    appropriationDetails,
    (row) => client.mutation(api.seed.insertAppropriationDetail, row),
    "appropriationDetails",
  );

  // Step 6: Seed department budgets
  const departmentBudgets = (
    seedData.department_budgets as Array<Record<string, unknown>>
  ).map((row) => {
    const t = transformKeys(row);
    return {
      department: t.department as string,
      category: t.category as string,
      lineItem: t.lineItem as string,
      actual2024: t.actual2024 as number | undefined,
      adopted2025: t.adopted2025 as number | undefined,
      requested2026: t.requested2026 as number | undefined,
      proposed2026: t.proposed2026 as number | undefined,
      changeVs2025: t.changeVs2025 as number | undefined,
      changeVsRequested: t.changeVsRequested as number | undefined,
    };
  });
  await insertBatch(
    departmentBudgets,
    (row) => client.mutation(api.seed.insertDepartmentBudget, row),
    "departmentBudgets",
  );

  // Step 7: Seed department meta
  const departmentMeta = (seedData.department_meta as Array<Record<string, unknown>>).map(
    (row) => {
      const t = transformKeys(row);
      return {
        name: t.name as string,
        mission: t.mission as string,
        totalExpenditures2026: t.totalExpenditures2026 as number | undefined,
        totalExpenditures2025: t.totalExpenditures2025 as number | undefined,
        totalRevenue2026: t.totalRevenue2026 as number | undefined,
        numServices: t.numServices as number,
        numPerfMeasures: t.numPerfMeasures as number,
      };
    },
  );
  await insertBatch(
    departmentMeta,
    (row) => client.mutation(api.seed.insertDepartmentMeta, row),
    "departmentMeta",
  );

  // Step 8: Seed department services
  const departmentServices = (
    seedData.department_services as Array<Record<string, unknown>>
  ).map((row) => {
    const t = transformKeys(row);
    return {
      department: t.department as string,
      name: t.name as string,
      operatingBudget: t.operatingBudget as number | undefined,
      capitalBudget: t.capitalBudget as number | undefined,
      grantBudget: t.grantBudget as number | undefined,
      ftes: t.ftes as number | undefined,
    };
  });
  await insertBatch(
    departmentServices,
    (row) => client.mutation(api.seed.insertDepartmentService, row),
    "departmentServices",
  );

  // Step 9: Seed performance measures
  const performanceMeasures = (
    seedData.performance_measures as Array<Record<string, unknown>>
  ).map((row) => {
    const t = transformKeys(row);
    return {
      department: t.department as string,
      measure: t.measure as string,
      actual2024: t.actual2024 as number | undefined,
      projected2025: t.projected2025 as number | undefined,
      planned2026: t.planned2026 as number | undefined,
    };
  });
  await insertBatch(
    performanceMeasures,
    (row) => client.mutation(api.seed.insertPerformanceMeasure, row),
    "performanceMeasures",
  );

  // Step 10: Seed positions
  const positions = (seedData.positions as Array<Record<string, unknown>>).map((row) => {
    const t = transformKeys(row);
    return {
      department: t.department as string,
      adopted2025: t.adopted2025 as number | undefined,
      requested2026: t.requested2026 as number | undefined,
      proposed2026: t.proposed2026 as number | undefined,
      changeVs2025: t.changeVs2025 as number | undefined,
      changeVsRequested: t.changeVsRequested as number | undefined,
    };
  });
  await insertBatch(
    positions,
    (row) => client.mutation(api.seed.insertPosition, row),
    "positions",
  );

  // Step 11: Seed historical comparison
  const historicalComparison = (
    seedData.historical_comparison as Array<Record<string, unknown>>
  ).map((row) => {
    const t = transformKeys(row);
    return {
      section: t.section as string,
      lineItem: t.lineItem as string,
      actual2023: t.actual2023 as number | undefined,
      actual2024: t.actual2024 as number | undefined,
      adopted2025: t.adopted2025 as number | undefined,
      proposed2026: t.proposed2026 as number | undefined,
      changeVs2025: t.changeVs2025 as number | undefined,
    };
  });
  await insertBatch(
    historicalComparison,
    (row) => client.mutation(api.seed.insertHistoricalComparison, row),
    "historicalComparison",
  );

  // Step 12: Seed department narratives
  const narratives = narrativesRaw.map((row) => {
    const t = transformKeys(row);
    return {
      department: t.department as string,
      pages: t.pages as string,
      fullText: t.fullText as string,
    };
  });
  await insertBatch(
    narratives,
    (row) => client.mutation(api.seed.insertDepartmentNarrative, row),
    "departmentNarratives",
    5, // smaller batch for large text fields
  );

  console.log("");
  console.log("Seed complete! Summary:");
  console.log(`  cityOverview: 1`);
  console.log(`  budgetSections: ${budgetSections.length}`);
  console.log(`  appropriationDetails: ${appropriationDetails.length}`);
  console.log(`  departmentBudgets: ${departmentBudgets.length}`);
  console.log(`  departmentMeta: ${departmentMeta.length}`);
  console.log(`  departmentServices: ${departmentServices.length}`);
  console.log(`  performanceMeasures: ${performanceMeasures.length}`);
  console.log(`  positions: ${positions.length}`);
  console.log(`  historicalComparison: ${historicalComparison.length}`);
  console.log(`  departmentNarratives: ${narratives.length}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
