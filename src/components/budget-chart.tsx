"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const MKE_COLORS = [
  "#0A3161",
  "#D4A574",
  "#2E8B57",
  "#C41E3A",
  "#5B8BA0",
  "#8B6914",
];

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface BudgetChartProps {
  chartType: "bar" | "line" | "pie" | "treemap";
  title: string;
  data: ChartData[];
  xLabel?: string;
  yLabel?: string;
  unit?: string;
}

const formatValue = (value: number, unit?: string) => {
  if (unit === "$" || !unit) {
    if (Math.abs(value) >= 1_000_000_000)
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(value) >= 1_000_000)
      return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }
  if (unit === "%") return `${value.toFixed(1)}%`;
  return `${value.toLocaleString()} ${unit}`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tooltipFormatter = (unit?: string) => (value: any) => [
  formatValue(Number(value ?? 0), unit),
  "Amount",
];

export function BudgetChart({
  chartType,
  title,
  data,
  xLabel,
  yLabel,
  unit,
}: BudgetChartProps) {
  const chartData = data.map((d, i) => ({
    name: d.label,
    value: d.value,
    fill: d.color ?? MKE_COLORS[i % MKE_COLORS.length],
  }));

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" />
              <XAxis
                type="number"
                tickFormatter={(v) => formatValue(v, unit)}
                label={
                  xLabel
                    ? { value: xLabel, position: "insideBottom", offset: -5 }
                    : undefined
                }
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={75}
                tick={{ fontSize: 12 }}
                label={
                  yLabel
                    ? {
                        value: yLabel,
                        angle: -90,
                        position: "insideLeft",
                      }
                    : undefined
                }
              />
              <Tooltip
                formatter={tooltipFormatter(unit)}
                contentStyle={{
                  border: "2px solid #1A1A2E",
                  borderRadius: "4px",
                  boxShadow: "2px 2px 0px 0px #1A1A2E",
                }}
              />
              <Legend />
              <Bar dataKey="value" name={yLabel ?? "Amount"} radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                label={
                  xLabel
                    ? { value: xLabel, position: "insideBottom", offset: -5 }
                    : undefined
                }
              />
              <YAxis
                tickFormatter={(v) => formatValue(v, unit)}
                tick={{ fontSize: 12 }}
                label={
                  yLabel
                    ? {
                        value: yLabel,
                        angle: -90,
                        position: "insideLeft",
                      }
                    : undefined
                }
              />
              <Tooltip
                formatter={tooltipFormatter(unit)}
                contentStyle={{
                  border: "2px solid #1A1A2E",
                  borderRadius: "4px",
                  boxShadow: "2px 2px 0px 0px #1A1A2E",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name={yLabel ?? "Amount"}
                stroke="#0A3161"
                strokeWidth={2}
                dot={{ fill: "#0A3161", r: 4 }}
                activeDot={{ r: 6, fill: "#D4A574" }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
      case "treemap":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, value }) =>
                  `${name}: ${formatValue(value, unit)}`
                }
                outerRadius={100}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke="#1A1A2E"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={tooltipFormatter(unit)}
                contentStyle={{
                  border: "2px solid #1A1A2E",
                  borderRadius: "4px",
                  boxShadow: "2px 2px 0px 0px #1A1A2E",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <p className="text-muted-foreground">Unsupported chart type.</p>;
    }
  };

  return (
    <div className="rounded-lg border-2 border-mke-dark bg-white p-4 shadow-[4px_4px_0px_0px_#1A1A2E]">
      <h3 className="mb-3 font-head text-lg font-bold text-mke-blue">
        {title}
      </h3>
      {renderChart()}
    </div>
  );
}
