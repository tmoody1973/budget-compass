import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // High-level budget overview
  cityOverview: defineTable({
    city: v.string(),
    state: v.string(),
    fiscalYear: v.number(),
    budgetType: v.string(),
    mayor: v.string(),
    totalBudget: v.number(),
    totalTaxLevy: v.number(),
    totalNonTaxLevy: v.number(),
    propertyTaxRatePer1000: v.number(),
    priorYearTaxRate: v.number(),
    taxRateChange: v.number(),
    assessedValue: v.number(),
  }),

  // 12 budget sections (A through N)
  budgetSections: defineTable({
    section: v.string(), // "A", "B", etc.
    name: v.string(),
    budget2025Adopted: v.number(),
    budget2026Proposed: v.number(),
    budgetChange: v.number(),
    nonTaxLevy2025: v.number(),
    nonTaxLevy2026: v.number(),
    taxLevy2025: v.number(),
    taxLevy2026: v.number(),
    taxLevyChange: v.number(),
    taxRate2025: v.number(),
    taxRate2026: v.number(),
  }).index("by_section", ["section"]),

  // Detailed appropriation line items
  appropriationDetails: defineTable({
    section: v.string(),
    sectionName: v.string(),
    subsection: v.string(), // "Appropriations" or "Funding Sources"
    lineItem: v.string(),
    adopted2025: v.optional(v.number()),
    requested2026: v.optional(v.number()),
    proposed2026: v.optional(v.number()),
    changeVs2025: v.optional(v.number()),
    changeVsRequested: v.optional(v.number()),
  })
    .index("by_section", ["section"])
    .index("by_line_item", ["lineItem"]),

  // Department budget line items (expenditures, revenues, personnel)
  departmentBudgets: defineTable({
    department: v.string(),
    category: v.string(), // "expenditure", "revenue", "personnel"
    lineItem: v.string(),
    actual2024: v.optional(v.number()),
    adopted2025: v.optional(v.number()),
    requested2026: v.optional(v.number()),
    proposed2026: v.optional(v.number()),
    changeVs2025: v.optional(v.number()),
    changeVsRequested: v.optional(v.number()),
  })
    .index("by_department", ["department"])
    .index("by_category", ["category"])
    .index("by_department_category", ["department", "category"]),

  // Department metadata
  departmentMeta: defineTable({
    name: v.string(),
    mission: v.string(),
    totalExpenditures2026: v.optional(v.number()),
    totalExpenditures2025: v.optional(v.number()),
    totalRevenue2026: v.optional(v.number()),
    numServices: v.number(),
    numPerfMeasures: v.number(),
  }).index("by_name", ["name"]),

  // Services per department
  departmentServices: defineTable({
    department: v.string(),
    name: v.string(),
    operatingBudget: v.optional(v.number()),
    capitalBudget: v.optional(v.number()),
    grantBudget: v.optional(v.number()),
    ftes: v.optional(v.number()),
  }).index("by_department", ["department"]),

  // Performance measures
  performanceMeasures: defineTable({
    department: v.string(),
    measure: v.string(),
    actual2024: v.optional(v.number()),
    projected2025: v.optional(v.number()),
    planned2026: v.optional(v.number()),
  }).index("by_department", ["department"]),

  // Position counts by department
  positions: defineTable({
    department: v.string(),
    adopted2025: v.optional(v.number()),
    requested2026: v.optional(v.number()),
    proposed2026: v.optional(v.number()),
    changeVs2025: v.optional(v.number()),
    changeVsRequested: v.optional(v.number()),
  }).index("by_department", ["department"]),

  // Historical multi-year comparison
  historicalComparison: defineTable({
    section: v.string(),
    lineItem: v.string(),
    actual2023: v.optional(v.number()),
    actual2024: v.optional(v.number()),
    adopted2025: v.optional(v.number()),
    proposed2026: v.optional(v.number()),
    changeVs2025: v.optional(v.number()),
  })
    .index("by_section", ["section"])
    .index("by_line_item", ["lineItem"]),

  // Department narratives for RAG/text search
  departmentNarratives: defineTable({
    department: v.string(),
    pages: v.string(),
    fullText: v.string(),
  })
    .index("by_department", ["department"])
    .searchIndex("search_text", {
      searchField: "fullText",
      filterFields: ["department"],
    }),
});
