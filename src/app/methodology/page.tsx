import Link from "next/link";

const TAX_RATES = [
  { jurisdiction: "Milwaukee Public Schools", rate: "$9.66" },
  { jurisdiction: "City of Milwaukee", rate: "$7.61" },
  { jurisdiction: "Milwaukee County", rate: "$3.15" },
  { jurisdiction: "MMSD", rate: "$1.24" },
  { jurisdiction: "MATC", rate: "$0.76" },
];

const PIPELINE_STEPS = [
  { label: "Source Documents", detail: "Budget PDFs, tax reports, MPROP API" },
  { label: "JSON Seed Files", detail: "Typed, schema-validated extracts" },
  { label: "Convex Database", detail: "Enforced schemas, deterministic queries" },
  { label: "Agent Queries", detail: "Amazon Nova calls Convex tools" },
  { label: "User Response", detail: "Exact numbers with source attribution" },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b-2 border-gray-900 bg-white px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded border-2 border-gray-900 bg-white px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0px_0px_#111] transition-all hover:shadow-[1px_1px_0px_0px_#111] hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            &larr; Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="mb-2 font-[family-name:var(--font-archivo-black)] text-3xl text-gray-900 md:text-4xl">
            Data Methodology
          </h1>
          <p className="text-lg text-gray-600">
            How MKE Budget Compass ensures every number is accurate, sourced,
            and verifiable.
          </p>
        </div>

        {/* Core Principle */}
        <section className="mb-10 rounded-lg border-2 border-gray-900 bg-blue-50 p-6 shadow-[4px_4px_0px_0px_#111]">
          <h2 className="mb-2 text-lg font-bold text-blue-900">
            Core Principle
          </h2>
          <p className="text-gray-800">
            <strong>
              Every number in Budget Compass comes from a database lookup, not
              an AI guess.
            </strong>{" "}
            When a user asks &ldquo;How much is the police budget?&rdquo;, the
            AI agent queries a structured database and returns the exact number.
            The agent cannot estimate, round, or hallucinate budget figures. If
            the data isn&rsquo;t in the database, the agent says so.
          </p>
        </section>

        {/* Data Pipeline */}
        <section className="mb-10">
          <h2 className="mb-4 border-b-2 border-gray-900 pb-2 text-xl font-bold text-gray-900">
            Data Pipeline
          </h2>
          <div className="flex flex-col gap-0 md:flex-row md:items-start md:gap-0">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center md:flex-col md:items-center md:flex-1">
                <div className="flex flex-col items-center md:w-full">
                  <div className="rounded border-2 border-gray-900 bg-white px-3 py-3 text-center shadow-[3px_3px_0px_0px_#111] w-full md:min-h-[80px] flex flex-col justify-center">
                    <p className="text-sm font-bold text-gray-900">
                      {step.label}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{step.detail}</p>
                  </div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <>
                    <span className="mx-2 text-xl font-bold text-blue-900 md:hidden">
                      &darr;
                    </span>
                    <span className="mx-1 hidden text-xl font-bold text-blue-900 md:block mt-2 md:mt-0 md:py-2">
                      &rarr;
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Tax Rates Table */}
        <section className="mb-10">
          <h2 className="mb-4 border-b-2 border-gray-900 pb-2 text-xl font-bold text-gray-900">
            Tax Rates (All 5 Jurisdictions)
          </h2>
          <div className="overflow-x-auto rounded-lg border-2 border-gray-900 shadow-[4px_4px_0px_0px_#111]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-900 bg-gray-900 text-white">
                  <th className="px-4 py-3 text-left font-bold">
                    Jurisdiction
                  </th>
                  <th className="px-4 py-3 text-right font-bold">
                    Rate (per $1,000)
                  </th>
                  <th className="px-4 py-3 text-left font-bold">Source</th>
                </tr>
              </thead>
              <tbody>
                {TAX_RATES.map((row, i) => (
                  <tr
                    key={row.jurisdiction}
                    className={`border-b border-gray-200 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.jurisdiction}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-900">
                      {row.rate}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      City of Milwaukee Comptroller, 2025 Combined Property Tax
                      Report (Dec 2025)
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-900 bg-gray-100">
                  <td className="px-4 py-3 font-bold text-gray-900">
                    Combined Rate
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-900">
                    $22.42
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-10">
          <h2 className="mb-4 border-b-2 border-gray-900 pb-2 text-xl font-bold text-gray-900">
            Source Documents
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* City */}
            <div className="rounded-lg border-2 border-gray-900 bg-white p-4 shadow-[3px_3px_0px_0px_#111]">
              <h3 className="mb-2 font-bold text-gray-900">
                City of Milwaukee
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>2026 Proposed Executive Budget (208 pages)</li>
                <li>Common Council adopted amendments</li>
              </ul>
              <a
                href="https://city.milwaukee.gov/budget"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                city.milwaukee.gov/budget &rarr;
              </a>
            </div>

            {/* MPS */}
            <div className="rounded-lg border-2 border-gray-900 bg-white p-4 shadow-[3px_3px_0px_0px_#111]">
              <h3 className="mb-2 font-bold text-gray-900">
                Milwaukee Public Schools
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>2025-26 Proposed Budget Summary (45 pages)</li>
                <li>2025-26 Budget Line Item Detail (Excel)</li>
                <li>Office &amp; School Budget Supplements</li>
              </ul>
              <a
                href="https://milwaukeepublic.ic-board.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                milwaukeepublic.ic-board.com &rarr;
              </a>
            </div>

            {/* County */}
            <div className="rounded-lg border-2 border-gray-900 bg-white p-4 shadow-[3px_3px_0px_0px_#111]">
              <h3 className="mb-2 font-bold text-gray-900">
                Milwaukee County
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>2026 Adopted Operating Budget (437 pages)</li>
                <li>2025 Adopted Capital Improvement Budget</li>
              </ul>
              <a
                href="https://county.milwaukee.gov/EN/Administrative-Services/Budget"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                county.milwaukee.gov/budget &rarr;
              </a>
            </div>

            {/* MPROP */}
            <div className="rounded-lg border-2 border-gray-900 bg-white p-4 shadow-[3px_3px_0px_0px_#111]">
              <h3 className="mb-2 font-bold text-gray-900">
                Property Data (MPROP)
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>CKAN API at data.milwaukee.gov</li>
                <li>~160,000 Milwaukee properties</li>
                <li>Assessed value, districts, zoning</li>
              </ul>
              <a
                href="https://data.milwaukee.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                data.milwaukee.gov &rarr;
              </a>
            </div>
          </div>
        </section>

        {/* Dual Data Strategy */}
        <section className="mb-10">
          <h2 className="mb-4 border-b-2 border-gray-900 pb-2 text-xl font-bold text-gray-900">
            Dual Data Strategy
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border-2 border-gray-900 bg-white p-4 shadow-[3px_3px_0px_0px_#111]">
              <h3 className="mb-1 font-bold text-blue-900">
                Seed Data (Convex)
              </h3>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Exact Numbers
              </p>
              <p className="text-sm text-gray-600">
                Every dollar amount comes from a deterministic database query
                against pre-verified seed data. No RAG, no estimation. This
                eliminates hallucination risk for financial data.
              </p>
            </div>
            <div className="rounded-lg border-2 border-gray-900 bg-white p-4 shadow-[3px_3px_0px_0px_#111]">
              <h3 className="mb-1 font-bold text-blue-900">
                Bedrock Knowledge Bases
              </h3>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Narrative Context
              </p>
              <p className="text-sm text-gray-600">
                For &ldquo;why&rdquo; questions and policy analysis, we use
                Amazon Bedrock Knowledge Bases with budget documents and
                Wisconsin Policy Forum analysis, stored in S3 and indexed in
                OpenSearch Serverless.
              </p>
            </div>
          </div>
        </section>

        {/* Known Limitations */}
        <section className="mb-10">
          <h2 className="mb-4 border-b-2 border-gray-900 pb-2 text-xl font-bold text-gray-900">
            Known Limitations
          </h2>
          <div className="rounded-lg border-2 border-gray-900 bg-yellow-50 p-4 shadow-[3px_3px_0px_0px_#111]">
            <ol className="list-inside list-decimal space-y-3 text-sm text-gray-700">
              <li>
                <strong>Proposed vs. Adopted:</strong> City department data is
                from the Proposed Budget. Some allocations changed during
                Council adoption.
              </li>
              <li>
                <strong>Tax rate timing:</strong> Mill rates are set each
                December. Our rates reflect the most recent published figures as
                of deployment.
              </li>
              <li>
                <strong>MPS summary level:</strong> We extracted office-level
                totals, not school-by-school detail. The line-item Excel file
                enables future granular analysis.
              </li>
              <li>
                <strong>County summary level:</strong> We extracted
                functional-area totals from the 437-page budget, not every
                department narrative.
              </li>
              <li>
                <strong>MMSD and MATC:</strong> Summary information only. These
                jurisdictions represent 5% and 4% of the tax bill respectively.
              </li>
            </ol>
          </div>
        </section>

        {/* How to Verify */}
        <section className="mb-10">
          <h2 className="mb-4 border-b-2 border-gray-900 pb-2 text-xl font-bold text-gray-900">
            How to Verify Our Numbers
          </h2>
          <p className="mb-3 text-sm text-gray-600">
            Every number in the app can be traced back to a specific document:
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-900" />
              <span>
                <strong>Tax rates</strong> &mdash; City Comptroller, 2025
                Combined Property Tax Report
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-900" />
              <span>
                <strong>City departments</strong> &mdash; 2026 Proposed
                Executive Budget, Section A (General City Purposes)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-900" />
              <span>
                <strong>MPS totals</strong> &mdash; 2025-26 Proposed Budget
                Summary, Executive Summary (page 2)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-900" />
              <span>
                <strong>County totals</strong> &mdash; 2026 Adopted Operating
                Budget, Budget Summary section
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-900" />
              <span>
                <strong>Property values</strong> &mdash; MPROP API (same data
                source as the City Assessor&rsquo;s office)
              </span>
            </li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            If you find a discrepancy, please report it. Civic data accuracy is
            a community effort.
          </p>
        </section>

        {/* Footer */}
        <footer className="border-t-2 border-gray-900 pt-4 text-center text-xs text-gray-400">
          <p>Last updated: March 2026</p>
          <p className="mt-1">
            MKE Budget Compass &mdash; Built for the Amazon Nova AI Hackathon
          </p>
        </footer>
      </main>
    </div>
  );
}
