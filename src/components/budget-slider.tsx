"use client";

interface BudgetSliderProps {
  sectionName: string;
  sectionLetter: string;
  currentAmount: number;
  originalAmount: number;
  totalBudget: number;
  onChange: (newAmount: number) => void;
}

const formatDollars = (value: number) => {
  if (Math.abs(value) >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

export function BudgetSlider({
  sectionName,
  sectionLetter,
  currentAmount,
  originalAmount,
  totalBudget,
  onChange,
}: BudgetSliderProps) {
  const delta = currentAmount - originalAmount;
  const pctOfTotal = totalBudget > 0 ? ((currentAmount / totalBudget) * 100).toFixed(1) : "0.0";
  const changeDir = delta > 0 ? "increase" : delta < 0 ? "decrease" : "neutral";

  const colorClass =
    changeDir === "increase"
      ? "text-mke-green"
      : changeDir === "decrease"
        ? "text-mke-danger"
        : "text-mke-dark";

  const borderColor =
    changeDir === "increase"
      ? "border-mke-green"
      : changeDir === "decrease"
        ? "border-mke-danger"
        : "border-mke-dark";

  return (
    <div
      className={`mb-3 rounded-lg border-2 ${borderColor} bg-white p-3 shadow-[2px_2px_0px_0px_#1A1A2E] transition-colors`}
    >
      {/* Header row */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-bold text-mke-dark">
          {sectionLetter} &mdash; {sectionName}
        </span>
        <span className={`text-sm font-bold ${colorClass}`}>
          {formatDollars(currentAmount)}
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={originalAmount * 2}
        step={1_000_000}
        value={currentAmount}
        onChange={(e) => onChange(Number(e.target.value))}
        className="budget-slider w-full"
      />

      {/* Footer row */}
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-mke-dark/60">{pctOfTotal}% of total</span>
        {delta !== 0 && (
          <span className={`font-bold ${colorClass}`}>
            {delta > 0 ? "+" : ""}
            {formatDollars(delta)}
          </span>
        )}
      </div>
    </div>
  );
}
