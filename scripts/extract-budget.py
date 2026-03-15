#!/usr/bin/env python3
"""
Extract structured budget data from city budget PDFs using Amazon Nova 2 Lite
document understanding via the Bedrock Converse API.

This script is part of Budget Compass's data pipeline. It reads a city budget PDF,
sends it to Nova 2 Lite for document understanding, and extracts structured
department-level budget data as JSON.

Usage:
    python scripts/extract-budget.py scripts/budget-pdfs/madison-budget.pdf \
        --city Madison --state WI --population 269840 \
        --output data/comparison/madison.json

Requirements:
    pip install boto3
    AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
"""

import argparse
import json
import sys
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

client = boto3.client("bedrock-runtime", region_name="us-east-1")
MODEL_ID = "us.amazon.nova-2-lite-v1:0"

EXTRACTION_PROMPT = """You are a municipal budget analyst. Extract structured budget data from this document.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation, no text before or after the JSON):

{
  "city": "<city name>",
  "state": "<state abbreviation>",
  "fiscal_year": <year as integer>,
  "population": <population as integer>,
  "total_budget": <total budget/expenditures in dollars as integer>,
  "total_revenue": <total revenue in dollars as integer, or null>,
  "tax_rate_per_1000": <property tax rate per $1,000 assessed value as float, or null if not found>,
  "property_tax_levy": <total property tax levy in dollars as integer, or null>,
  "departments": [
    {
      "name": "<department or functional area name>",
      "category": "<one of: public_safety, infrastructure, community_services, government_ops, education, health_human_services, parks_recreation, debt_service, transit, other>",
      "budget": <budget/expenditure amount in dollars as integer>,
      "percent_of_total": <percentage of total budget as float, e.g. 15.2>
    }
  ],
  "revenue_sources": [
    {
      "source": "<revenue source name>",
      "amount": <amount in dollars as integer>
    }
  ],
  "extracted_from": "<document title or filename>",
  "extraction_notes": "<any important caveats about the data quality or what couldn't be found>"
}

Rules:
- Extract EVERY department or functional area that has a budget amount listed
- Use exact dollar amounts from the document tables. NEVER estimate or round beyond what the document shows.
- Normalize department names to standard categories using the category field:
  * Police, fire, emergency services, corrections → public_safety
  * Roads, water, sewer, DPW, engineering → infrastructure
  * Libraries, community development, housing, social services → community_services
  * City hall, clerk, treasurer, assessor, IT, HR, legal → government_ops
  * Schools, education → education
  * Health departments, behavioral health, aging → health_human_services
  * Parks, recreation, culture, arts → parks_recreation
  * Debt payments, bond service → debt_service
  * Bus, transit, transportation authority → transit
  * Everything else → other
- If a field is not found in the document, use null
- If population is not in the document, use the value provided below
- Convert all dollar amounts to whole numbers (no cents)
- If the document shows amounts in thousands or millions, convert to full dollar amounts
"""


def extract_budget(pdf_path: str, city: str, state: str, population: int) -> dict:
    """Send a budget PDF to Nova 2 Lite and extract structured data."""
    pdf_bytes = Path(pdf_path).read_bytes()
    pdf_name = Path(pdf_path).stem

    size_mb = len(pdf_bytes) / (1024 * 1024)
    print(f"PDF size: {size_mb:.1f} MB", file=sys.stderr)

    prompt = f"{EXTRACTION_PROMPT}\n\nCity: {city}, {state}\nPopulation: {population}"

    response = client.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {"text": prompt},
                    {
                        "document": {
                            "format": "pdf",
                            "name": pdf_name,
                            "source": {"bytes": pdf_bytes},
                        }
                    },
                ],
            }
        ],
        inferenceConfig={"maxTokens": 8192, "temperature": 0.1},
    )

    response_text = response["output"]["message"]["content"][0]["text"]

    # Strip markdown code fences if Nova wraps the JSON
    text = response_text.strip()
    if text.startswith("```"):
        first_newline = text.find("\n")
        text = text[first_newline + 1:] if first_newline != -1 else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object in the response
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            data = json.loads(text[start:end])
        else:
            raise

    # Ensure required fields have fallback values
    data.setdefault("city", city)
    data.setdefault("state", state)
    data.setdefault("population", population)
    data.setdefault("departments", [])
    data.setdefault("revenue_sources", [])
    data.setdefault("extracted_from", pdf_name)

    return data


def validate_extraction(data: dict) -> list[str]:
    """Check extracted data for obvious issues."""
    warnings = []

    if not data.get("departments"):
        warnings.append("No departments extracted!")

    total = data.get("total_budget", 0)
    if total and total < 1_000_000:
        warnings.append(f"Total budget seems too low: ${total:,} -- check if amounts are in thousands")

    dept_sum = sum(d.get("budget", 0) for d in data.get("departments", []))
    if total and dept_sum > 0:
        ratio = dept_sum / total
        if ratio < 0.5:
            warnings.append(f"Department sum (${dept_sum:,}) is only {ratio:.0%} of total (${total:,})")
        elif ratio > 1.5:
            warnings.append(f"Department sum (${dept_sum:,}) exceeds total (${total:,}) by {ratio:.0%}")

    for dept in data.get("departments", []):
        if dept.get("budget", 0) < 0:
            warnings.append(f"Negative budget for {dept['name']}: ${dept['budget']:,}")

    return warnings


def main():
    parser = argparse.ArgumentParser(
        description="Extract budget data from PDF using Nova 2 Lite document understanding"
    )
    parser.add_argument("pdf_path", help="Path to the budget PDF file")
    parser.add_argument("--city", required=True, help="City name")
    parser.add_argument("--state", required=True, help="State abbreviation (e.g., WI)")
    parser.add_argument("--population", required=True, type=int, help="City population")
    parser.add_argument("--output", help="Output JSON file path (default: stdout)")
    args = parser.parse_args()

    pdf = Path(args.pdf_path)
    if not pdf.exists():
        print(f"Error: PDF not found: {args.pdf_path}", file=sys.stderr)
        sys.exit(1)

    print(f"{'=' * 60}", file=sys.stderr)
    print(f"Budget Compass - Nova 2 Lite Document Understanding", file=sys.stderr)
    print(f"{'=' * 60}", file=sys.stderr)
    print(f"PDF:        {pdf.name}", file=sys.stderr)
    print(f"City:       {args.city}, {args.state}", file=sys.stderr)
    print(f"Population: {args.population:,}", file=sys.stderr)
    print(f"Model:      {MODEL_ID}", file=sys.stderr)
    print(f"{'=' * 60}", file=sys.stderr)
    print("Sending PDF to Nova 2 Lite...", file=sys.stderr)

    try:
        data = extract_budget(args.pdf_path, args.city, args.state, args.population)
    except ClientError as e:
        print(f"\nBedrock API error: {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"\nFailed to parse JSON from Nova response: {e}", file=sys.stderr)
        print("Raw response may not be valid JSON. Check the prompt.", file=sys.stderr)
        sys.exit(1)

    # Validate
    warnings = validate_extraction(data)
    if warnings:
        print(f"\n⚠ Validation warnings:", file=sys.stderr)
        for w in warnings:
            print(f"  - {w}", file=sys.stderr)

    # Output
    output = json.dumps(data, indent=2)

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(output)
        print(f"\nSaved to: {args.output}", file=sys.stderr)
    else:
        print(output)

    # Summary
    dept_count = len(data.get("departments", []))
    total = data.get("total_budget", 0) or 0
    rev_count = len(data.get("revenue_sources", []))
    print(f"\n{'=' * 60}", file=sys.stderr)
    print(f"Extraction complete:", file=sys.stderr)
    print(f"  {dept_count} departments extracted", file=sys.stderr)
    print(f"  {rev_count} revenue sources extracted", file=sys.stderr)
    print(f"  Total budget: ${total:,.0f}", file=sys.stderr)
    if data.get("tax_rate_per_1000"):
        print(f"  Tax rate: ${data['tax_rate_per_1000']:.2f} per $1,000", file=sys.stderr)
    print(f"{'=' * 60}", file=sys.stderr)


if __name__ == "__main__":
    main()
