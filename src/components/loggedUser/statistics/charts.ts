import type { ChartOptions } from "chart.js";
import type { DailyOutcomes } from "./calculations";

const GRID = "rgba(255,255,255,0.05)";
const AXIS = "#64748b";

export const COLORS = {
  win: "#10b981",
  loss: "#ef4444",
  active: "#64748b",
  primary: "#38bdf8",
  secondary: "#f97316",
} as const;

// ── Monthly overview: stacked daily outcome bars (wins / active / losses) ──────
export const monthlyBarOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  layout: { padding: { top: 8 } },
  plugins: {
    legend: {
      display: true,
      position: "top",
      align: "end",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 8,
        boxHeight: 8,
        padding: 18,
        color: "#94a3b8",
        font: { size: 11, weight: 600 },
      },
    },
    tooltip: {
      backgroundColor: "#0b1628",
      borderColor: "rgba(56,189,248,0.25)",
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      titleColor: "#e2e8f0",
      titleFont: { size: 12, weight: 700 },
      bodyColor: "#cbd5e1",
      bodyFont: { size: 12 },
      usePointStyle: true,
      boxPadding: 6,
      // Hide zero-count segments so the tooltip only shows what happened that day.
      filter: (item) => Number(item.parsed.y) > 0,
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: AXIS,
        font: { size: 10 },
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12,
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      grid: { color: GRID, drawTicks: false },
      border: { display: false },
      ticks: { color: AXIS, font: { size: 10 }, precision: 0, padding: 8 },
    },
  },
};

export function buildMonthlyBars(labels: string[], outcomes: DailyOutcomes): any {
  const base = {
    stack: "outcomes",
    borderRadius: 4,
    borderSkipped: false,
    maxBarThickness: 26,
    categoryPercentage: 0.7,
    barPercentage: 0.9,
  };
  return {
    labels,
    datasets: [
      { label: "Dobitni", data: outcomes.wins, backgroundColor: COLORS.win, ...base },
      { label: "Aktivni", data: outcomes.actives, backgroundColor: COLORS.active, ...base },
      { label: "Gubitni", data: outcomes.losses, backgroundColor: COLORS.loss, ...base },
    ],
  };
}

export const barOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "bottom",
      labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 8, color: "#94a3b8", padding: 14, font: { size: 11, weight: 600 } },
    },
    tooltip: {
      backgroundColor: "#0b1628",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      titleColor: "#e2e8f0",
      bodyColor: "#cbd5e1",
    },
  },
  scales: {
    y: { beginAtZero: true, grid: { color: GRID, drawTicks: false }, border: { display: false }, ticks: { color: AXIS, font: { size: 10 }, precision: 0 } },
    x: { grid: { display: false }, border: { display: false }, ticks: { display: false } },
  },
};

export const doughnutOptions: ChartOptions<"doughnut"> = {
  cutout: "82%",
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0b1628",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      titleColor: "#e2e8f0",
      bodyColor: "#cbd5e1",
      usePointStyle: true,
    },
  },
};

export function buildDoughnut(wins = 0, losses = 0) {
  return {
    labels: ["Prolaznost", "Padovi"],
    datasets: [
      {
        data: [wins, losses],
        backgroundColor: [COLORS.win, "crimson"],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };
}

export function buildDailyBar(wins = 0, actives = 0, losses = 0) {
  return {
    labels: [""],
    datasets: [
      { label: "Dobitni", data: [wins], backgroundColor: COLORS.win, borderRadius: 8, maxBarThickness: 60 },
      actives > 0
        ? { label: "Aktivni", data: [actives], backgroundColor: COLORS.active, borderRadius: 8, maxBarThickness: 60 }
        : null,
      { label: "Gubitni", data: [losses], backgroundColor: COLORS.loss, borderRadius: 8, maxBarThickness: 60 },
    ].filter(Boolean) as any[],
  };
}
