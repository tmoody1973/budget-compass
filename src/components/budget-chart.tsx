"use client";

import ReactECharts from "echarts-for-react";

const MKE_COLORS = [
  "#0A3161", "#D4A574", "#2E8B57", "#C41E3A", "#5B8BA0", "#8B6914",
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
    if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }
  if (unit === "%") return `${value.toFixed(1)}%`;
  return `${value.toLocaleString()} ${unit}`;
};

export function BudgetChart({ chartType, title, data, xLabel, yLabel, unit }: BudgetChartProps) {
  const colors = data.map((d, i) => d.color ?? MKE_COLORS[i % MKE_COLORS.length]);

  const getOption = () => {
    switch (chartType) {
      case "bar":
        return {
          tooltip: {
            trigger: "axis",
            formatter: (params: any) => {
              const p = params[0];
              return `${p.name}: ${formatValue(p.value, unit)}`;
            },
          },
          xAxis: { type: "category", data: data.map(d => d.label), name: xLabel },
          yAxis: {
            type: "value",
            name: yLabel,
            axisLabel: { formatter: (v: number) => formatValue(v, unit) },
          },
          series: [{
            type: "bar",
            data: data.map((d, i) => ({
              value: d.value,
              itemStyle: { color: colors[i], borderColor: "#1A1A2E", borderWidth: 1 },
            })),
            animationDuration: 800,
            animationEasing: "elasticOut",
          }],
        };

      case "pie":
        return {
          tooltip: {
            formatter: (p: any) => `${p.name}: ${formatValue(p.value, unit)} (${p.percent}%)`,
          },
          series: [{
            type: "pie",
            radius: ["30%", "70%"],
            data: data.map((d, i) => ({
              name: d.label,
              value: d.value,
              itemStyle: { color: colors[i], borderColor: "#1A1A2E", borderWidth: 2 },
            })),
            animationType: "scale",
            animationDuration: 800,
            label: { formatter: "{b}: {d}%" },
          }],
        };

      case "line":
        return {
          tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: data.map(d => d.label), name: xLabel },
          yAxis: {
            type: "value",
            name: yLabel,
            axisLabel: { formatter: (v: number) => formatValue(v, unit) },
          },
          series: [{
            type: "line",
            data: data.map(d => d.value),
            smooth: true,
            lineStyle: { color: "#0A3161", width: 3 },
            areaStyle: { color: "rgba(10, 49, 97, 0.1)" },
            animationDuration: 1000,
          }],
        };

      case "treemap":
        return {
          tooltip: {
            formatter: (p: any) => `${p.name}: ${formatValue(p.value, unit)}`,
          },
          series: [{
            type: "treemap",
            data: data.map((d, i) => ({
              name: d.label,
              value: d.value,
              itemStyle: { color: colors[i], borderColor: "#1A1A2E", borderWidth: 2 },
            })),
            label: {
              show: true,
              formatter: (p: any) => `${p.name}\n${formatValue(p.value, unit)}`,
              fontSize: 12,
              fontWeight: "bold",
            },
            breadcrumb: { show: false },
            animationDuration: 800,
          }],
        };

      default:
        return {};
    }
  };

  return (
    <div className="rounded-lg border-2 border-mke-dark bg-white p-4 shadow-[4px_4px_0px_0px_#1A1A2E]">
      <h3 className="mb-3 font-head text-lg font-bold text-mke-blue">{title}</h3>
      <ReactECharts option={getOption()} style={{ height: 300 }} />
    </div>
  );
}
