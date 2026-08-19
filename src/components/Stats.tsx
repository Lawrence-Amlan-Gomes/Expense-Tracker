"use client";

import React, { useEffect, useState, useMemo } from "react";
import { findUserByEmail, updateIncomeSources } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { useRouter } from "next/navigation";
import { IMonth, IIncome } from "@/store/features/auth/authSlice";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowLeft,
  Flame,
  Target,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  DollarSign,
  PiggyBank,
  Plus,
  Pencil,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart,
  Legend,
  ComposedChart,
  ReferenceLine,
} from "recharts";


// =============================================================================
// SECTION 1: TYPE DEFINITIONS
// =============================================================================
// All TypeScript types/interfaces used throughout this component.

/** Which tab is currently active. */
type ViewTab = "overview" | "income" | "expense" | "balance";

const DEFAULT_INCOME_SOURCE = "Dad";

/** Data shape for a single month in the bar/line charts. */
interface MonthlyTotal {
  shortLabel: string;   // e.g. "Jan '25" — used as the chart axis label
  fullName: string;     // e.g. "January 2025" — used in tables
  total: number;        // total spending for that month
  entryCount: number;   // how many spending entries that month
}

/** Theme color tokens — every color used in the UI is defined here. */
interface ThemeTokens {
  background: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  hover: string;
}


// =============================================================================
// SECTION 2: CONSTANTS
// =============================================================================

/** Tab definitions for the navigation bar. */
const MONTH_ORDER = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const TAB_DEFINITIONS: { id: ViewTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Activity     },
  { id: "income",   label: "Income",   icon: DollarSign   },
  { id: "expense",  label: "Expense",  icon: TrendingDown },
  { id: "balance",  label: "Balance",  icon: PiggyBank    },
];


// =============================================================================
// SECTION 3: HELPER FUNCTIONS
// =============================================================================

/**
 * Build theme color tokens based on light/dark mode.
 *
 * @param isLightTheme - `true` for light mode, `false` for dark mode
 * @returns An object containing all UI color values
 *
 * In the app, `theme === true` means LIGHT (white background, black text),
 * and `theme === false` means DARK (black background, white text).
 */
function getThemeTokens(isLightTheme: boolean): ThemeTokens {
  if (isLightTheme) {
    return {
      background: "#f5f5f7",
      card:       "#ffffff",
      border:     "#e8e8e8",
      text:       "#000000",
      muted:      "#999999",
      hover:      "rgba(0, 0, 0, 0.03)",
    };
  }

  // Dark mode
  return {
    background: "#000000",
    card:       "#0d0d0d",
    border:     "#1e1e1e",
    text:       "#ffffff",
    muted:      "#555555",
    hover:      "rgba(255, 255, 255, 0.04)",
  };
}

/**
 * Convert a month name string (e.g. "January 2025") to a Date object.
 * We append " 1" to make it "January 2025 1" which JavaScript can parse.
 */
function monthNameToDate(monthName: string): Date {
  return new Date(monthName + " 1");
}

/**
 * Convert a full month name to a short label for chart axes.
 *
 * @example
 * formatShortMonth("January 2025") // "Jan '25"
 */
function formatShortMonth(monthName: string): string {
  const date = new Date(monthName + " 1");
  return date.toLocaleString("default", { month: "short", year: "2-digit" });
}

/**
 * Check if a month name (e.g. "January 2025") refers to the current
 * (still ongoing / incomplete) month.
 *
 * We use this to exclude the current month from stats that require
 * a completed month — like "Lowest Month", "Monthly Average", trends,
 * and insights — because the current month's data is still accumulating
 * and would unfairly skew those calculations downward.
 *
 * The current month still appears in charts and the summary table so
 * the user can see their progress.
 */
function isCurrentMonth(monthName: string): boolean {
  const monthDate = new Date(monthName + " 1");
  const now = new Date();

  return (
    monthDate.getMonth() === now.getMonth() &&
    monthDate.getFullYear() === now.getFullYear()
  );
}


// =============================================================================
// SECTION 4: SMALL UI COMPONENTS
// =============================================================================
// Reusable presentational components used across all tabs.

// ─── Custom Tooltip (shared by all Recharts charts) ──────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string }[];
  label?: string;
  themeTokens: ThemeTokens;
}

/**
 * A styled tooltip that appears when hovering over chart data points.
 * Recharts passes `active`, `payload`, and `label` automatically.
 */
function CustomTooltip({ active, payload, label, themeTokens }: CustomTooltipProps) {
  // Don't render anything if the tooltip isn't active or has no data
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className="px-3 py-2 rounded-xl shadow-2xl text-xs"
      style={{
        background: themeTokens.card,
        border: `1px solid ${themeTokens.border}`,
        color: themeTokens.text,
      }}
    >
      {/* Tooltip header — the x-axis label (e.g. "Jan '25") */}
      {label && (
        <div
          className="font-bold mb-1 uppercase tracking-widest"
          style={{ color: themeTokens.muted }}
        >
          {label}
        </div>
      )}

      {/* One row per data series */}
      {payload.map((dataPoint, index) => (
        <div key={index} className="flex items-center gap-1.5">
          {/* Color dot */}
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: dataPoint.color }}
          />
          {/* Series name */}
          <span style={{ color: themeTokens.muted }}>
            {dataPoint.name || "Spending"}:
          </span>
          {/* Value */}
          <span className="font-bold">
            ৳ {dataPoint.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  accentColor: string;
  themeTokens: ThemeTokens;
  trendInverted?: boolean;
}

/**
 * A card displaying a single key metric (e.g. "Total This Year: ৳120,000").
 * Includes an icon, optional trend badge, and optional subtitle.
 */
function StatCard({
  label,
  value,
  subtitle,
  icon: IconComponent,
  trend,
  accentColor,
  themeTokens,
  trendInverted = false,
}: StatCardProps) {
  /**
   * Determine the trend badge's colors based on direction:
   * - "up" = spending increased (red — bad)
   * - "down" = spending decreased (green — good)
   * - "neutral" = no significant change (grey)
   */
  function getTrendStyles(trendDirection: "up" | "down" | "neutral") {
    switch (trendDirection) {
      case "up":
        return {
          background: trendInverted ? "#10b98122" : "#f43f5e22",
          color: trendInverted ? "#10b981" : "#f43f5e",
          label: "Higher",
          Icon: TrendingUp,
        };
      case "down":
        return {
          background: trendInverted ? "#f43f5e22" : "#10b98122",
          color: trendInverted ? "#f43f5e" : "#10b981",
          label: "Lower",
          Icon: TrendingDown,
        };
      default:
        return {
          background: "#55555522",
          color: themeTokens.muted,
          label: "Stable",
          Icon: null,
        };
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 sm:p-6 transition-all hover:scale-[1.02]"
      style={{
        background: themeTokens.card,
        border: `1px solid ${themeTokens.border}`,
      }}
    >
      {/* Decorative glow behind the card */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl"
        style={{ background: accentColor }}
      />

      <div className="relative z-10">
        {/* Top row: icon + trend badge */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          {/* Icon */}
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
            style={{ background: accentColor + "22" }}
          >
            <IconComponent size={18} style={{ color: accentColor }} />
          </div>

          {/* Trend badge (only shown if trend is provided) */}
          {trend && (() => {
            const trendStyles = getTrendStyles(trend);
            return (
              <div
                className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                style={{
                  background: trendStyles.background,
                  color: trendStyles.color,
                }}
              >
                {trendStyles.Icon && <trendStyles.Icon size={11} />}
                <span className="hidden sm:inline">{trendStyles.label}</span>
              </div>
            );
          })()}
        </div>

        {/* Main value */}
        <div
          className="text-lg sm:text-2xl font-black tracking-tight leading-tight"
          style={{ color: themeTokens.text }}
        >
          {value}
        </div>

        {/* Label */}
        <div
          className="text-xs font-semibold uppercase tracking-widest mt-1"
          style={{ color: themeTokens.muted }}
        >
          {label}
        </div>

        {/* Subtitle (hidden on mobile to save space) */}
        {subtitle && (
          <div
            className="text-xs mt-1 hidden sm:block"
            style={{ color: themeTokens.muted }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

/**
 * Shown inside chart containers when there's no data to display.
 */
function EmptyState({ themeTokens, message }: { themeTokens: ThemeTokens; message?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-32 sm:h-40 gap-3"
      style={{ color: themeTokens.muted }}
    >
      <BarChart3 size={28} className="opacity-30" />
      <p className="text-sm font-medium opacity-50">
        {message || "No data to display yet"}
      </p>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

/**
 * A small title + subtitle pair used at the top of each chart section.
 */
function SectionHeader({
  title,
  subtitle,
  themeTokens,
  total,
}: {
  title: string;
  subtitle: string;
  themeTokens: ThemeTokens;
  total?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
      <div>
        <h2
          className="text-xs font-black uppercase tracking-widest mb-0.5"
          style={{ color: themeTokens.muted }}
        >
          {title}
        </h2>
        <p className="text-xs" style={{ color: themeTokens.muted }}>
          {subtitle}
        </p>
      </div>
      {total !== undefined && (
        <div className="text-right flex-shrink-0">
          <div className="text-base sm:text-lg font-black" style={{ color: themeTokens.text }}>
            {total}
          </div>
          <div
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: themeTokens.muted }}
          >
            Total
          </div>
        </div>
      )}
    </div>
  );
}

/** Add/rename/delete pills for income sources (e.g. "Dad", "Freelance"). */
function IncomeSourcePills({
  sources,
  themeTokens,
  onAdd,
  onRename,
  onDelete,
}: {
  sources: string[];
  themeTokens: ThemeTokens;
  onAdd: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newSource, setNewSource] = useState("");
  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const commitNewSource = () => {
    if (newSource.trim()) onAdd(newSource.trim());
    setNewSource("");
    setAdding(false);
  };

  const commitRename = () => {
    if (editingSource && editValue.trim()) {
      onRename(editingSource, editValue.trim());
    }
    setEditingSource(null);
    setEditValue("");
  };

  const inputStyle: React.CSSProperties = {
    background: themeTokens.background,
    border: `1px solid ${themeTokens.border}`,
    color: themeTokens.text,
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {sources.map((source) => {
        if (editingSource === source) {
          return (
            <input
              key={source}
              autoFocus
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                else if (e.key === "Escape") {
                  setEditingSource(null);
                  setEditValue("");
                }
              }}
              onBlur={commitRename}
              className="w-28 px-2.5 py-1.5 rounded-sm text-xs outline-none"
              style={{ ...inputStyle, borderColor: "#6366f1" }}
            />
          );
        }
        return (
          <div
            key={source}
            className="flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-sm text-xs font-semibold"
            style={{
              background: themeTokens.card,
              color: themeTokens.text,
              border: `1px solid ${themeTokens.border}`,
            }}
          >
            <span>{source}</span>
            <button
              onClick={() => {
                setEditingSource(source);
                setEditValue(source);
              }}
              className="p-0.5 rounded transition-colors"
              style={{ color: "inherit", opacity: 0.6 }}
              title="Rename source"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete income source "${source}"?`))
                  onDelete(source);
              }}
              className="p-0.5 rounded transition-colors"
              style={{ color: "inherit", opacity: 0.6 }}
              title="Delete source"
            >
              <X size={11} />
            </button>
          </div>
        );
      })}
      {adding ? (
        <input
          autoFocus
          type="text"
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitNewSource();
            else if (e.key === "Escape") {
              setNewSource("");
              setAdding(false);
            }
          }}
          onBlur={commitNewSource}
          placeholder="Source name"
          className="w-32 px-2.5 py-1.5 rounded-sm text-xs outline-none"
          style={inputStyle}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-semibold transition-all"
          style={{
            background: "transparent",
            color: "#6366f1",
            border: "1px dashed #6366f1",
          }}
        >
          <Plus size={12} /> Source
        </button>
      )}
    </div>
  );
}

// =============================================================================
// SECTION 5: DATA PROCESSING FUNCTIONS
// =============================================================================
// Pure functions that transform raw month data into chart-ready structures.
// These are called inside useMemo hooks in the main component.

/**
 * Extract unique years from the month data, sorted newest first.
 *
 * @example
 * extractAvailableYears([{ name: "January 2025", ... }, { name: "March 2024", ... }])
 * // → [2025, 2024]
 */
function extractAvailableYears(months: IMonth[], income: IIncome[]): number[] {
  const yearSet = new Set<number>();
  for (const month of months) {
    const year = new Date(month.name + " 1").getFullYear();
    if (!isNaN(year) && year > 2000 && year < 2100) yearSet.add(year);
  }
  for (const inc of income) {
    if (inc.year > 2000 && inc.year < 2100) yearSet.add(inc.year);
  }
  return [...yearSet].sort((a, b) => b - a);
}

/**
 * Filter months to a specific year and sort them chronologically.
 */
function getMonthsForYear(months: IMonth[], year: number): IMonth[] {
  return months
    .filter((month) => {
      const monthYear = new Date(month.name + " 1").getFullYear();
      return monthYear === year;
    })
    .sort((a, b) => {
      return monthNameToDate(a.name).getTime() - monthNameToDate(b.name).getTime();
    });
}

/**
 * Calculate total spending per month for a given set of months.
 * Returns an array of { shortLabel, fullName, total, entryCount } objects.
 */
function calculateMonthlyTotals(monthsForYear: IMonth[]): MonthlyTotal[] {
  return monthsForYear.map((month) => {
    // Sum up all spending costs for this month
    const total = month.spendings.reduce(
      (sum, spending) => sum + spending.cost,
      0
    );

    return {
      shortLabel: formatShortMonth(month.name),
      fullName: month.name,
      total,
      entryCount: month.spendings.length,
    };
  });
}


/**
 * Determine the month-over-month spending trend by comparing
 * the last two COMPLETED months.
 *
 * - "up"      → spending increased (latest > previous)
 * - "down"    → spending decreased (latest < previous)
 * - "neutral" → spending stayed the same or not enough data
 *
 * Note: We use `completedMonthlyTotals` here (which excludes the current
 * incomplete month) so the trend reflects finished months only.
 */
// Income entries are per-(year, month, source) — a month can now have
// several entries (one per source). Both functions below sum by month
// before returning, so multi-source months don't show as duplicate rows.
function calculateMonthlyIncome(income: IIncome[], year: number) {
  const totals = new Map<string, number>();
  for (const i of income.filter((i) => i.year === year)) {
    totals.set(i.month, (totals.get(i.month) || 0) + i.amount);
  }
  return MONTH_ORDER.filter((month) => totals.has(month)).map((month) => ({
    shortLabel: formatShortMonth(`${month} ${year}`),
    fullName: `${month} ${year}`,
    monthName: month,
    income: totals.get(month) || 0,
  }));
}

/** Income for one specific (year, month), grouped by source — for the
 * Income tab's "${monthName} Income" per-source breakdown chart. */
function calculateIncomeBySource(
  income: IIncome[],
  year: number,
  month: string,
  incomeSources: string[]
) {
  const totals = new Map<string, number>();
  for (const i of income.filter((i) => i.year === year && i.month === month)) {
    const source = i.source || "Unknown";
    totals.set(source, (totals.get(source) || 0) + i.amount);
  }
  const orderedSources = [
    ...incomeSources.filter((s) => totals.has(s)),
    ...[...totals.keys()].filter((s) => !incomeSources.includes(s)),
  ];
  return orderedSources.map((source) => ({
    source,
    amount: totals.get(source) || 0,
  }));
}

/** Same as `parseSpendingItem`, but keeps each item's `category` alongside
 * its cost — needed for the Expense tab's per-category breakdown, since
 * `parseSpendingItem` only returns name → cost. */
function parseSpendingItemDetailed(
  itemString: string
): { name: string; cost: number; category: string }[] {
  try {
    const parsed = JSON.parse(itemString);
    const isValidObject =
      typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
    if (!isValidObject) throw new Error("Not a valid spending item object");

    return Object.entries(parsed).map(([name, value]) => {
      if (value && typeof value === "object" && "cost" in (value as object)) {
        const v = value as { cost: unknown; category?: unknown };
        return {
          name,
          cost: Number(v.cost) || 0,
          category: typeof v.category === "string" && v.category ? v.category : "Uncategorized",
        };
      }
      return { name, cost: Number(value) || 0, category: "Uncategorized" };
    });
  } catch {
    return [{ name: itemString, cost: 0, category: "Uncategorized" }];
  }
}

/** Spending for one specific (year, month), grouped by category — for the
 * Expense tab's "${monthName} Expense" per-category breakdown chart. */
function calculateExpenseByCategory(months: IMonth[], year: number, month: string) {
  const target = months.find((m) => m.name === `${month} ${year}`);
  const totals = new Map<string, number>();
  if (target) {
    for (const spending of target.spendings || []) {
      for (const item of parseSpendingItemDetailed(spending.item)) {
        totals.set(item.category, (totals.get(item.category) || 0) + item.cost);
      }
    }
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function calculateAllTimeIncome(income: IIncome[]) {
  const totals = new Map<string, { year: number; month: string; total: number }>();
  for (const i of income) {
    const key = `${i.year}-${i.month}`;
    const existing = totals.get(key);
    if (existing) existing.total += i.amount;
    else totals.set(key, { year: i.year, month: i.month, total: i.amount });
  }
  return [...totals.values()]
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month);
    })
    .map((i) => ({
      name: formatShortMonth(`${i.month} ${i.year}`),
      total: i.total,
    }));
}

/**
 * Merge all-time spending and income into one series, keyed by month,
 * for the Overview "All-Time Trend" combined chart.
 */
function calculateAllTimeTrend(
  months: IMonth[],
  income: IIncome[]
): { name: string; fullName: string; spending: number; income: number }[] {
  const spendingByKey = new Map<string, number>();
  for (const m of months) {
    spendingByKey.set(
      m.name,
      m.spendings.reduce((sum, s) => sum + s.cost, 0)
    );
  }
  const incomeByKey = new Map<string, number>();
  for (const i of income) {
    const key = `${i.month} ${i.year}`;
    incomeByKey.set(key, (incomeByKey.get(key) || 0) + i.amount);
  }
  const allKeys = new Set([...spendingByKey.keys(), ...incomeByKey.keys()]);
  return [...allKeys]
    .sort(
      (a, b) => monthNameToDate(a).getTime() - monthNameToDate(b).getTime()
    )
    .map((key) => ({
      name: formatShortMonth(key),
      fullName: key,
      spending: spendingByKey.get(key) || 0,
      income: incomeByKey.get(key) || 0,
    }));
}

function calculateBalanceData(
  monthlyTotals: { shortLabel: string; fullName: string; total: number }[],
  monthlyIncome: { shortLabel: string; fullName: string; monthName: string; income: number }[]
) {
  return monthlyTotals.map((mt) => {
    const monthOnly = mt.fullName.split(" ")[0];
    const inc = monthlyIncome.find((i) => i.monthName === monthOnly)?.income || 0;
    return {
      shortLabel: mt.shortLabel,
      fullName: mt.fullName,
      income: inc,
      spending: mt.total,
      net: inc - mt.total,
    };
  });
}

function calculateMonthOverMonthTrend(
  completedMonthlyTotals: MonthlyTotal[]
): "up" | "down" | "neutral" {
  // We need at least 2 completed months to compare
  if (completedMonthlyTotals.length < 2) {
    return "neutral";
  }

  const lastTwoMonths = completedMonthlyTotals.slice(-2);
  const previousMonth = lastTwoMonths[0];
  const latestMonth = lastTwoMonths[1];

  if (latestMonth.total > previousMonth.total) return "up";
  if (latestMonth.total < previousMonth.total) return "down";
  return "neutral";
}

// =============================================================================
// SECTION 6: MAIN COMPONENT
// =============================================================================

export default function Stats() {
  // ── External hooks ────────────────────────────────────────────────────────
  const { theme } = useTheme();
  const { user: authUser, setAuth, hydrated } = useAuth();
  const router = useRouter();

  // ── Local state ───────────────────────────────────────────────────────────
  const [hasMounted, setHasMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("overview");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [trendScope, setTrendScope] = useState<"all" | "year">("all");
  const [isTrendYearDropdownOpen, setIsTrendYearDropdownOpen] = useState(false);
  const [incomeTrendScope, setIncomeTrendScope] = useState<"all" | "year">("all");
  const [isIncomeTrendYearDropdownOpen, setIsIncomeTrendYearDropdownOpen] = useState(false);
  const [selectedIncomeMonth, setSelectedIncomeMonth] = useState<string | null>(null);
  const [isIncomeMonthDropdownOpen, setIsIncomeMonthDropdownOpen] = useState(false);
  const [expenseTrendScope, setExpenseTrendScope] = useState<"all" | "year">("all");
  const [isExpenseTrendYearDropdownOpen, setIsExpenseTrendYearDropdownOpen] = useState(false);
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<string | null>(null);
  const [isExpenseMonthDropdownOpen, setIsExpenseMonthDropdownOpen] = useState(false);
  const [isBalanceYearDropdownOpen, setIsBalanceYearDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [allMonths, setAllMonths] = useState<IMonth[]>([]);
  const [allIncome, setAllIncome] = useState<IIncome[]>([]);
  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const themeTokens = getThemeTokens(theme);

  // ── Mount ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasMounted || !hydrated) return;
    if (authUser === null) {
      router.push("/login");
    }
  }, [authUser, hasMounted, hydrated, router]);

  // ── Always fetch fresh data from DB directly ──────────────────────────────
  useEffect(() => {
    if (!hasMounted) return;

    const fetchData = async () => {
      if (typeof window !== "undefined") setIsFetching(true);
      try {
        // get email from Redux or localStorage
        let email = authUser?.email;
        if (!email) {
          const stored = localStorage.getItem("authUser");
          if (stored) {
            const parsed = JSON.parse(stored);
            email = parsed.email;
          }
        }
        if (!email) {
          setIsFetching(false);
          return;
        }

        const freshUser = await findUserByEmail(email);
        if (freshUser && freshUser.money) {
          setAllMonths(freshUser.money.Months || []);
          setAllIncome(freshUser.income || []);
          setIncomeSources(
            freshUser.incomeSources && freshUser.incomeSources.length > 0
              ? freshUser.incomeSources
              : [DEFAULT_INCOME_SOURCE],
          );
          setAuth({
            ...freshUser,
            paymentType: freshUser.paymentType ?? "Free One Week",
          });
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
        // fallback to whatever is in Redux
        setAllMonths(authUser?.money?.Months || []);
        setAllIncome(authUser?.income || []);
        setIncomeSources(
          authUser?.incomeSources && authUser.incomeSources.length > 0
            ? authUser.incomeSources
            : [DEFAULT_INCOME_SOURCE],
        );
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMounted]);

  // ── Income source pills (persist immediately — this page has no Save
  // button / draft-state pattern like the dashboard) ───────────────────────
  const persistIncomeSources = async (
    newIncome: IIncome[],
    newSources: string[],
  ) => {
    if (!authUser?.email) return;
    setAllIncome(newIncome);
    setIncomeSources(newSources);
    try {
      await updateIncomeSources(authUser.email, newIncome, newSources);
      setAuth({ ...authUser, income: newIncome, incomeSources: newSources });
    } catch (err) {
      console.error("Failed to update income sources:", err);
      alert("❌ Failed to save changes");
    }
  };

  const handleAddIncomeSource = (name: string) => {
    if (incomeSources.includes(name)) return;
    persistIncomeSources(allIncome, [...incomeSources, name]);
  };

  const handleRenameIncomeSource = (oldName: string, newName: string) => {
    if (newName === oldName) return;
    if (incomeSources.includes(newName)) {
      alert("❌ A source with this name already exists");
      return;
    }
    const newSources = incomeSources.map((s) => (s === oldName ? newName : s));
    const newIncome = allIncome.map((i) =>
      i.source === oldName ? { ...i, source: newName } : i,
    );
    persistIncomeSources(newIncome, newSources);
  };

  const handleDeleteIncomeSource = (name: string) => {
    if (allIncome.some((i) => i.source === name)) {
      alert(
        "❌ This income source is still assigned to income entries — reassign or remove them first",
      );
      return;
    }
    persistIncomeSources(
      allIncome,
      incomeSources.filter((s) => s !== name),
    );
  };

  // ── Derived / computed data ───────────────────────────────────────────────
  // Each `useMemo` caches its result and only recalculates when its
  // dependencies change. This prevents expensive re-computation on every render.

  /** List of unique years found in the data, newest first. */
  const availableYears = useMemo(
    () => extractAvailableYears(allMonths, allIncome),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allMonths, allIncome]
  );

  /** Auto-select the most recent year when data first loads or after sync. */
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear === null) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  /** Months filtered to the selected year, sorted chronologically. */
  const monthsForYear = useMemo(
    () => (selectedYear !== null ? getMonthsForYear(allMonths, selectedYear) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allMonths, selectedYear]
  );

  /**
   * Monthly totals for the selected year.
   * Includes ALL months (even the current incomplete month) —
   * used for charts and the summary table.
   */
  const monthlyTotals = useMemo(
    () => calculateMonthlyTotals(monthsForYear),
    [monthsForYear]
  );

  /**
   * Monthly totals with the CURRENT month excluded.
   * Used for calculations that need complete data:
   *   - Monthly Average
   *   - Lowest Month
   *   - Month-over-month trend
   *
   * Why exclude the current month?
   * Because the current month is still accumulating data. If today is
   * March 10th, the "March" total only has 10 days of spending, making
   * it artificially low compared to completed months. Including it
   * would skew averages downward and make it always appear as the
   * "Lowest Month", which isn't useful.
   */
  const completedMonthlyTotals = useMemo(
    () => monthlyTotals.filter((month) => !isCurrentMonth(month.fullName)),
    [monthlyTotals]
  );

  /** All-time spending + income merged by month (Overview's "All-Time Trend"). */
  const allTimeTrendData = useMemo(
    () => calculateAllTimeTrend(allMonths, allIncome),
    [allMonths, allIncome]
  );

  const monthlyIncome = useMemo(
    () => (selectedYear !== null ? calculateMonthlyIncome(allIncome, selectedYear) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allIncome, selectedYear]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allTimeIncome = useMemo(() => calculateAllTimeIncome(allIncome), [allIncome]);

  /** Months with recorded income for the selected year, in calendar order —
   * drives the per-source breakdown chart's month dropdown. */
  const availableIncomeMonths = useMemo(
    () => monthlyIncome.map((m) => m.monthName),
    [monthlyIncome]
  );

  // Keep the selected month valid as the year (or its data) changes — default
  // to the most recent month with income recorded.
  useEffect(() => {
    if (availableIncomeMonths.length === 0) {
      if (selectedIncomeMonth !== null) setSelectedIncomeMonth(null);
      return;
    }
    if (!selectedIncomeMonth || !availableIncomeMonths.includes(selectedIncomeMonth)) {
      setSelectedIncomeMonth(availableIncomeMonths[availableIncomeMonths.length - 1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableIncomeMonths]);

  const incomeBySourceData = useMemo(
    () =>
      selectedYear !== null && selectedIncomeMonth
        ? calculateIncomeBySource(allIncome, selectedYear, selectedIncomeMonth, incomeSources)
        : [],
    [allIncome, selectedYear, selectedIncomeMonth, incomeSources]
  );

  const balanceData = useMemo(
    () => calculateBalanceData(monthlyTotals, monthlyIncome),
    [monthlyTotals, monthlyIncome]
  );

  /** Data + x-axis key for the Overview "All-Time Trend" chart, switched by `trendScope`. */
  const trendChartData = trendScope === "all" ? allTimeTrendData : balanceData;
  const trendXKey = trendScope === "all" ? "name" : "shortLabel";

  /** Same underlying series as the Overview trend, reused for the Income tab's
   * income-only "All-Time Income Trend" chart, switched by `incomeTrendScope`. */
  const incomeTrendChartData = incomeTrendScope === "all" ? allTimeTrendData : balanceData;
  const incomeTrendXKey = incomeTrendScope === "all" ? "name" : "shortLabel";

  /** Same underlying series again, for the Expense tab's spending-only
   * "All-Time Expense Trend" chart, switched by `expenseTrendScope`. */
  const expenseTrendChartData = expenseTrendScope === "all" ? allTimeTrendData : balanceData;
  const expenseTrendXKey = expenseTrendScope === "all" ? "name" : "shortLabel";

  /** Months with recorded spending for the selected year, in calendar order —
   * drives the per-category breakdown chart's month dropdown. */
  const availableExpenseMonths = useMemo(
    () =>
      monthlyTotals
        .filter((m) => m.entryCount > 0)
        .map((m) => m.fullName.split(" ")[0]),
    [monthlyTotals]
  );

  // Keep the selected month valid as the year (or its data) changes — default
  // to the most recent month with spending recorded.
  useEffect(() => {
    if (availableExpenseMonths.length === 0) {
      if (selectedExpenseMonth !== null) setSelectedExpenseMonth(null);
      return;
    }
    if (!selectedExpenseMonth || !availableExpenseMonths.includes(selectedExpenseMonth)) {
      setSelectedExpenseMonth(availableExpenseMonths[availableExpenseMonths.length - 1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableExpenseMonths]);

  const expenseByCategoryData = useMemo(
    () =>
      selectedYear !== null && selectedExpenseMonth
        ? calculateExpenseByCategory(allMonths, selectedYear, selectedExpenseMonth)
        : [],
    [allMonths, selectedYear, selectedExpenseMonth]
  );

  // ── Summary statistics ────────────────────────────────────────────────────

  /** Total spending across all months in the selected year (includes current month). */
  const totalThisYear = monthlyTotals.reduce(
    (sum, month) => sum + month.total,
    0
  );

  /**
   * Average monthly spending — based on COMPLETED months only.
   * This avoids the current incomplete month pulling the average down.
   */
  const averagePerMonth = completedMonthlyTotals.length > 0
    ? Math.round(
        completedMonthlyTotals.reduce((sum, month) => sum + month.total, 0) /
        completedMonthlyTotals.length
      )
    : 0;

  /**
   * Highest-spending month — uses ALL months (including current).
   * The current month can be the highest if spending is genuinely high.
   */
  const highestMonth = monthlyTotals.reduce(
    (best, current) => (current.total > best.total ? current : best),
    { shortLabel: "-", total: 0, fullName: "-", entryCount: 0 }
  );

  /**
   * Lowest-spending month — uses COMPLETED months only.
   * Excluding the current month prevents it from always being "lowest"
   * simply because it hasn't finished yet.
   * Only considers months with spending > 0 (empty months don't count).
   */
  const completedMonthsWithSpending = completedMonthlyTotals.filter(
    (month) => month.total > 0
  );
  const lowestMonth = completedMonthsWithSpending.length > 0
    ? completedMonthsWithSpending.reduce(
        (best, current) => (current.total < best.total ? current : best)
      )
    : null;

  /**
   * Month-over-month trend — based on COMPLETED months only.
   * Compares the last two finished months to determine direction.
   */
  const monthOverMonthTrend = calculateMonthOverMonthTrend(completedMonthlyTotals);

  const totalIncomeThisYear = monthlyIncome.reduce((s, i) => s + i.income, 0);
  const completedIncomeMonths = monthlyIncome.filter(
    (i) => !isCurrentMonth(i.fullName) && i.income > 0
  );
  const averageMonthlyIncome =
    completedIncomeMonths.length > 0
      ? Math.round(completedIncomeMonths.reduce((s, i) => s + i.income, 0) / completedIncomeMonths.length)
      : 0;
  const highestIncomeMonth = monthlyIncome.length > 0
    ? monthlyIncome.reduce(
        (best, cur) => (cur.income > best.income ? cur : best)
      )
    : { shortLabel: "—", income: 0, fullName: "—", monthName: "" };
  /** Lowest-income month — completed months only, mirrors `lowestMonth`. */
  const lowestIncomeMonth = completedIncomeMonths.length > 0
    ? completedIncomeMonths.reduce(
        (best, cur) => (cur.income < best.income ? cur : best)
      )
    : null;
  /** Income month-over-month trend — "up" (more income) is good, so its
   *  card is rendered with `trendInverted`. */
  const incomeMonthOverMonthTrend: "up" | "down" | "neutral" = (() => {
    if (completedIncomeMonths.length < 2) return "neutral";
    const [prev, latest] = completedIncomeMonths.slice(-2);
    if (latest.income > prev.income) return "up";
    if (latest.income < prev.income) return "down";
    return "neutral";
  })();
  const netBalanceThisYear = totalIncomeThisYear - totalThisYear;
  const savingsRateThisYear =
    totalIncomeThisYear > 0 ? Math.round((netBalanceThisYear / totalIncomeThisYear) * 100) : 0;
  const surplusMonths = balanceData.filter((b) => b.income > 0 && b.net >= 0).length;
  const deficitMonths = balanceData.filter((b) => b.income > 0 && b.net < 0).length;
  const bestSavingsMonth =
    balanceData.length > 0
      ? balanceData.reduce((best, cur) => (cur.net > best.net ? cur : best))
      : null;
  const cumulativeBalance = useMemo(() => {
    let running = 0;
    return balanceData.map((b) => {
      running += b.net;
      return { label: b.shortLabel, cumulative: running };
    });
  }, [balanceData]);

  // ── Don't render until client-side hydration is complete ──────────────────
  if (!hasMounted) {
    return null;
  }

  if (isFetching) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: themeTokens.background }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "#6366f1", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  // ── Wait for auth user data to be available ───────────────────────────────
  if (!authUser) {
    return null;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen pt-[63px] font-sans"
      style={{ background: themeTokens.background, color: themeTokens.text }}
    >

      {/* ================================================================== */}
      {/* STICKY HEADER — Back button, title, year picker, and tab bar       */}
      {/* ================================================================== */}
      <div
        className="sticky top-[63px] z-40 border-b"
        style={{ background: themeTokens.background, borderColor: themeTokens.border }}
      >
        {/* Top bar: Back button + Title + Year picker */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          {/* Left side: Back button + Title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
              style={{ color: themeTokens.text }}
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Vertical divider */}
            <div
              className="w-px h-5 flex-shrink-0"
              style={{ background: themeTokens.border }}
            />

            <h1
              className="text-base sm:text-xl font-black tracking-tight truncate"
              style={{ color: themeTokens.text }}
            >
              Financial Analytics
            </h1>
          </div>

          {/* Right side: Year picker dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              style={{
                background: themeTokens.card,
                border: `1px solid ${themeTokens.border}`,
                color: themeTokens.text,
              }}
            >
              <Calendar size={13} style={{ color: "#6366f1" }} />
              {selectedYear != null && !isNaN(selectedYear) ? selectedYear : "—"}
              <ChevronDown
                size={13}
                style={{ color: themeTokens.muted }}
                className={`transition-transform ${isYearDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown menu */}
            {isYearDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[90px]"
                style={{
                  background: themeTokens.card,
                  border: `1px solid ${themeTokens.border}`,
                }}
              >
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setIsYearDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-bold transition-colors hover:opacity-80"
                    style={{ color: year === selectedYear ? "#6366f1" : themeTokens.text }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab bar — scrollable on mobile */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex overflow-x-auto scrollbar-none gap-0">
          {TAB_DEFINITIONS.map(({ id, label, icon: TabIcon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all relative flex-shrink-0"
                style={{ color: isActive ? "#6366f1" : themeTokens.muted }}
              >
                <TabIcon size={14} />
                {label}
                {/* Active indicator line */}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "#6366f1" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* PAGE CONTENT — One section per tab                                 */}
      {/* ================================================================== */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* OVERVIEW TAB                                                      */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-4 sm:space-y-8">

            {/* Spending stat cards — 2 columns on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Total This Year"
                value={`৳ ${totalThisYear.toLocaleString()}`}
                subtitle={`Across ${monthlyTotals.length} months`}
                icon={Wallet}
                accentColor="#ef4444"
                themeTokens={themeTokens}
                trend="neutral"
              />
              <StatCard
                label="Monthly Average"
                value={`৳ ${averagePerMonth.toLocaleString()}`}
                subtitle="Based on completed months"
                icon={BarChart3}
                accentColor="#f43f5e"
                themeTokens={themeTokens}
                trend={monthOverMonthTrend}
              />
              <StatCard
                label="Highest Month"
                value={highestMonth.total > 0 ? highestMonth.shortLabel : "—"}
                subtitle={highestMonth.total > 0 ? `৳ ${highestMonth.total.toLocaleString()}` : undefined}
                icon={Flame}
                accentColor="#dc2626"
                themeTokens={themeTokens}
              />
              <StatCard
                label="Lowest Month"
                value={lowestMonth ? lowestMonth.shortLabel : "—"}
                subtitle={lowestMonth ? `৳ ${lowestMonth.total.toLocaleString()}` : undefined}
                icon={Target}
                accentColor="#fb7185"
                themeTokens={themeTokens}
              />
            </div>

            {/* Income stat cards — same shape as spending's, greenish */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Total Income"
                value={`৳ ${totalIncomeThisYear.toLocaleString()}`}
                subtitle={`Across ${monthlyIncome.length} months`}
                icon={DollarSign}
                accentColor="#10b981"
                themeTokens={themeTokens}
                trend="neutral"
              />
              <StatCard
                label="Monthly Average"
                value={`৳ ${averageMonthlyIncome.toLocaleString()}`}
                subtitle="Based on completed months"
                icon={BarChart3}
                accentColor="#22c55e"
                themeTokens={themeTokens}
                trend={incomeMonthOverMonthTrend}
                trendInverted
              />
              <StatCard
                label="Highest Month"
                value={highestIncomeMonth.income > 0 ? highestIncomeMonth.shortLabel : "—"}
                subtitle={highestIncomeMonth.income > 0 ? `৳ ${highestIncomeMonth.income.toLocaleString()}` : undefined}
                icon={Flame}
                accentColor="#059669"
                themeTokens={themeTokens}
              />
              <StatCard
                label="Lowest Month"
                value={lowestIncomeMonth ? lowestIncomeMonth.shortLabel : "—"}
                subtitle={lowestIncomeMonth ? `৳ ${lowestIncomeMonth.income.toLocaleString()}` : undefined}
                icon={Target}
                accentColor="#34d399"
                themeTokens={themeTokens}
              />
            </div>

            {/* All-time trend — income vs. spending, all-time or selected year */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{
                background: themeTokens.card,
                border: `1px solid ${themeTokens.border}`,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                <div>
                  <h2
                    className="text-xs font-black uppercase tracking-widest mb-0.5"
                    style={{ color: themeTokens.muted }}
                  >
                    All-Time Trend
                  </h2>
                  <p className="text-xs" style={{ color: themeTokens.muted }}>
                    Income vs. spending
                    {trendScope === "year" ? ` — ${selectedYear}` : ", all tracked periods"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {(["all", "year"] as const).map((scope) => {
                    const active = trendScope === scope;
                    return (
                      <button
                        key={scope}
                        onClick={() => {
                          setTrendScope(scope);
                          if (scope !== "year") setIsTrendYearDropdownOpen(false);
                        }}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: active ? "#6366f1" : themeTokens.hover,
                          color: active ? "#fff" : themeTokens.muted,
                        }}
                      >
                        {scope === "all" ? "All Time" : "Year"}
                      </button>
                    );
                  })}
                  {trendScope === "year" && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setIsTrendYearDropdownOpen((open) => !open)
                        }
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{ background: themeTokens.hover, color: themeTokens.text }}
                      >
                        {selectedYear ?? "—"}
                        <ChevronDown
                          size={11}
                          className={`transition-transform ${isTrendYearDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isTrendYearDropdownOpen && (
                        <div
                          className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[90px]"
                          style={{
                            background: themeTokens.card,
                            border: `1px solid ${themeTokens.border}`,
                          }}
                        >
                          {availableYears.map((year) => (
                            <button
                              key={year}
                              onClick={() => {
                                setSelectedYear(year);
                                setIsTrendYearDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:opacity-80"
                              style={{ color: year === selectedYear ? "#6366f1" : themeTokens.text }}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {trendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis
                      dataKey={trendXKey}
                      tick={{ fill: themeTokens.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: themeTokens.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                      width={38}
                    />
                    <Tooltip
                      content={<CustomTooltip themeTokens={themeTokens} />}
                      cursor={{ stroke: themeTokens.border }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: themeTokens.muted }} />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="spending"
                      name="Spending"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444", r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState themeTokens={themeTokens} />
              )}
            </div>
          </div>
        )}

        {/* ── INCOME TAB ──────────────────────────────────────────────── */}
        {activeTab === "income" && (
          <div className="space-y-4 sm:space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <StatCard label="Total Income" value={`৳ ${totalIncomeThisYear.toLocaleString()}`} subtitle={`${selectedYear}`} icon={DollarSign} accentColor="#10b981" themeTokens={themeTokens} />
              <StatCard label="Monthly Average" value={`৳ ${averageMonthlyIncome.toLocaleString()}`} subtitle="Completed months" icon={BarChart3} accentColor="#22c55e" themeTokens={themeTokens} trend={incomeMonthOverMonthTrend} trendInverted />
              <StatCard label="Highest Month" value={highestIncomeMonth.income > 0 ? highestIncomeMonth.shortLabel : "—"} subtitle={highestIncomeMonth.income > 0 ? `৳ ${highestIncomeMonth.income.toLocaleString()}` : undefined} icon={Flame} accentColor="#059669" themeTokens={themeTokens} />
              <StatCard label="Lowest Month" value={lowestIncomeMonth ? lowestIncomeMonth.shortLabel : "—"} subtitle={lowestIncomeMonth ? `৳ ${lowestIncomeMonth.income.toLocaleString()}` : undefined} icon={Target} accentColor="#34d399" themeTokens={themeTokens} />
              <StatCard label="All-Time Income" value={`৳ ${allTimeIncome.reduce((s, i) => s + i.total, 0).toLocaleString()}`} subtitle={`${allIncome.length} months tracked`} icon={Wallet} accentColor="#16a34a" themeTokens={themeTokens} />
              <StatCard label="Income Sources" value={incomeSources.length.toString()} subtitle={incomeSources.length === 1 ? "Source tracked" : "Sources tracked"} icon={Activity} accentColor="#4ade80" themeTokens={themeTokens} />
            </div>

            <IncomeSourcePills
              sources={incomeSources}
              themeTokens={themeTokens}
              onAdd={handleAddIncomeSource}
              onRename={handleRenameIncomeSource}
              onDelete={handleDeleteIncomeSource}
            />

            <div className="rounded-2xl p-4 sm:p-6" style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}>
              <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: themeTokens.muted }}>
                    All-Time Income Trend
                  </h2>
                  <p className="text-xs" style={{ color: themeTokens.muted }}>
                    Income
                    {incomeTrendScope === "year" ? ` — ${selectedYear}` : ", all tracked periods"}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right flex-shrink-0">
                  <div className="text-base sm:text-lg font-black" style={{ color: themeTokens.text }}>
                    ৳ {incomeTrendChartData.reduce((s, d) => s + d.income, 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: themeTokens.muted }}>
                    Total
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {(["all", "year"] as const).map((scope) => {
                    const active = incomeTrendScope === scope;
                    return (
                      <button
                        key={scope}
                        onClick={() => {
                          setIncomeTrendScope(scope);
                          if (scope !== "year") setIsIncomeTrendYearDropdownOpen(false);
                        }}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: active ? "#10b981" : themeTokens.hover,
                          color: active ? "#fff" : themeTokens.muted,
                        }}
                      >
                        {scope === "all" ? "All Time" : "Year"}
                      </button>
                    );
                  })}
                  {incomeTrendScope === "year" && (
                    <div className="relative">
                      <button
                        onClick={() => setIsIncomeTrendYearDropdownOpen((open) => !open)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{ background: themeTokens.hover, color: themeTokens.text }}
                      >
                        {selectedYear ?? "—"}
                        <ChevronDown size={11} className={`transition-transform ${isIncomeTrendYearDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isIncomeTrendYearDropdownOpen && (
                        <div
                          className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[90px]"
                          style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}
                        >
                          {availableYears.map((year) => (
                            <button
                              key={year}
                              onClick={() => {
                                setSelectedYear(year);
                                setIsIncomeTrendYearDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:opacity-80"
                              style={{ color: year === selectedYear ? "#10b981" : themeTokens.text }}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                </div>
              </div>
              {incomeTrendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={incomeTrendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis
                      dataKey={incomeTrendXKey}
                      tick={{ fill: themeTokens.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: themeTokens.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                      width={38}
                    />
                    <Tooltip content={<CustomTooltip themeTokens={themeTokens} />} cursor={{ stroke: themeTokens.border }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: themeTokens.muted }} />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState themeTokens={themeTokens} />
              )}
            </div>

            <div className="rounded-2xl p-4 sm:p-6" style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}>
              <SectionHeader title={`Monthly Income — ${selectedYear}`} subtitle="Income recorded each month" themeTokens={themeTokens} total={`৳ ${totalIncomeThisYear.toLocaleString()}`} />
              {monthlyIncome.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyIncome} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis dataKey="shortLabel" tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<CustomTooltip themeTokens={themeTokens} />} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="income" name="Income" radius={[7,7,0,0]} fill="#10b981" fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState themeTokens={themeTokens} message="No income recorded yet. Deposit to a bank or earn cash to start tracking." />}
            </div>

            <div className="rounded-2xl p-4 sm:p-6" style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}>
              <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: themeTokens.muted }}>
                    {selectedIncomeMonth ? `${selectedIncomeMonth} Income — ${selectedYear}` : `Income by Source — ${selectedYear}`}
                  </h2>
                  <p className="text-xs" style={{ color: themeTokens.muted }}>
                    {selectedIncomeMonth
                      ? `Income of ${selectedIncomeMonth} according to income sources.`
                      : "No income recorded for this year yet."}
                  </p>
                </div>
                {availableIncomeMonths.length > 0 && (
                  <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right flex-shrink-0">
                    <div className="text-base sm:text-lg font-black" style={{ color: themeTokens.text }}>
                      ৳ {incomeBySourceData.reduce((s, d) => s + d.amount, 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: themeTokens.muted }}>
                      Total
                    </div>
                  </div>
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setIsIncomeMonthDropdownOpen((open) => !open)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                      style={{ background: themeTokens.hover, color: themeTokens.text }}
                    >
                      {selectedIncomeMonth ?? "—"}
                      <ChevronDown size={11} className={`transition-transform ${isIncomeMonthDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isIncomeMonthDropdownOpen && (
                      <div
                        className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[120px]"
                        style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}
                      >
                        {availableIncomeMonths.map((month) => (
                          <button
                            key={month}
                            onClick={() => {
                              setSelectedIncomeMonth(month);
                              setIsIncomeMonthDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:opacity-80"
                            style={{ color: month === selectedIncomeMonth ? "#10b981" : themeTokens.text }}
                          >
                            {month}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                )}
              </div>
              {incomeBySourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={incomeBySourceData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis dataKey="source" tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<CustomTooltip themeTokens={themeTokens} />} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="amount" name="Income" radius={[7,7,0,0]} fill="#10b981" fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState themeTokens={themeTokens} message="No income recorded yet. Deposit to a bank or earn cash to start tracking." />}
            </div>
          </div>
        )}

        {/* ── EXPENSE TAB ──────────────────────────────────────────────── */}
        {activeTab === "expense" && (
          <div className="space-y-4 sm:space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <StatCard label="Total Expense" value={`৳ ${totalThisYear.toLocaleString()}`} subtitle={`${selectedYear}`} icon={Wallet} accentColor="#ef4444" themeTokens={themeTokens} />
              <StatCard label="Monthly Average" value={`৳ ${averagePerMonth.toLocaleString()}`} subtitle="Completed months" icon={BarChart3} accentColor="#f43f5e" themeTokens={themeTokens} trend={monthOverMonthTrend} />
              <StatCard label="Highest Month" value={highestMonth.total > 0 ? highestMonth.shortLabel : "—"} subtitle={highestMonth.total > 0 ? `৳ ${highestMonth.total.toLocaleString()}` : undefined} icon={Flame} accentColor="#dc2626" themeTokens={themeTokens} />
              <StatCard label="Lowest Month" value={lowestMonth ? lowestMonth.shortLabel : "—"} subtitle={lowestMonth ? `৳ ${lowestMonth.total.toLocaleString()}` : undefined} icon={Target} accentColor="#fb7185" themeTokens={themeTokens} />
              <StatCard label="All-Time Expense" value={`৳ ${allTimeTrendData.reduce((s, d) => s + d.spending, 0).toLocaleString()}`} subtitle={`${allTimeTrendData.filter((d) => d.spending > 0).length} months tracked`} icon={DollarSign} accentColor="#b91c1c" themeTokens={themeTokens} />
              <StatCard label="Categories" value={(authUser?.money?.categories?.length || 1).toString()} subtitle={(authUser?.money?.categories?.length || 1) === 1 ? "Category tracked" : "Categories tracked"} icon={PieChart} accentColor="#f87171" themeTokens={themeTokens} />
            </div>

            <div className="rounded-2xl p-4 sm:p-6" style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}>
              <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: themeTokens.muted }}>
                    All-Time Expense Trend
                  </h2>
                  <p className="text-xs" style={{ color: themeTokens.muted }}>
                    Spending
                    {expenseTrendScope === "year" ? ` — ${selectedYear}` : ", all tracked periods"}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right flex-shrink-0">
                  <div className="text-base sm:text-lg font-black" style={{ color: themeTokens.text }}>
                    ৳ {expenseTrendChartData.reduce((s, d) => s + d.spending, 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: themeTokens.muted }}>
                    Total
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {(["all", "year"] as const).map((scope) => {
                    const active = expenseTrendScope === scope;
                    return (
                      <button
                        key={scope}
                        onClick={() => {
                          setExpenseTrendScope(scope);
                          if (scope !== "year") setIsExpenseTrendYearDropdownOpen(false);
                        }}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: active ? "#ef4444" : themeTokens.hover,
                          color: active ? "#fff" : themeTokens.muted,
                        }}
                      >
                        {scope === "all" ? "All Time" : "Year"}
                      </button>
                    );
                  })}
                  {expenseTrendScope === "year" && (
                    <div className="relative">
                      <button
                        onClick={() => setIsExpenseTrendYearDropdownOpen((open) => !open)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{ background: themeTokens.hover, color: themeTokens.text }}
                      >
                        {selectedYear ?? "—"}
                        <ChevronDown size={11} className={`transition-transform ${isExpenseTrendYearDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isExpenseTrendYearDropdownOpen && (
                        <div
                          className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[90px]"
                          style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}
                        >
                          {availableYears.map((year) => (
                            <button
                              key={year}
                              onClick={() => {
                                setSelectedYear(year);
                                setIsExpenseTrendYearDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:opacity-80"
                              style={{ color: year === selectedYear ? "#ef4444" : themeTokens.text }}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                </div>
              </div>
              {expenseTrendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={expenseTrendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis
                      dataKey={expenseTrendXKey}
                      tick={{ fill: themeTokens.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: themeTokens.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                      width={38}
                    />
                    <Tooltip content={<CustomTooltip themeTokens={themeTokens} />} cursor={{ stroke: themeTokens.border }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: themeTokens.muted }} />
                    <Line
                      type="monotone"
                      dataKey="spending"
                      name="Spending"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444", r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState themeTokens={themeTokens} />
              )}
            </div>

            <div className="rounded-2xl p-4 sm:p-6" style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}>
              <SectionHeader title={`Monthly Expense — ${selectedYear}`} subtitle="Spending recorded each month" themeTokens={themeTokens} total={`৳ ${totalThisYear.toLocaleString()}`} />
              {monthlyTotals.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyTotals} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis dataKey="shortLabel" tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<CustomTooltip themeTokens={themeTokens} />} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="total" name="Spending" radius={[7,7,0,0]} fill="#ef4444" fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState themeTokens={themeTokens} message="No spending recorded yet." />}
            </div>

            <div className="rounded-2xl p-4 sm:p-6" style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}>
              <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: themeTokens.muted }}>
                    {selectedExpenseMonth ? `${selectedExpenseMonth} Expense — ${selectedYear}` : `Expense by Category — ${selectedYear}`}
                  </h2>
                  <p className="text-xs" style={{ color: themeTokens.muted }}>
                    {selectedExpenseMonth
                      ? `Expense of ${selectedExpenseMonth} according to categories.`
                      : "No spending recorded for this year yet."}
                  </p>
                </div>
                {availableExpenseMonths.length > 0 && (
                  <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right flex-shrink-0">
                    <div className="text-base sm:text-lg font-black" style={{ color: themeTokens.text }}>
                      ৳ {expenseByCategoryData.reduce((s, d) => s + d.amount, 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: themeTokens.muted }}>
                      Total
                    </div>
                  </div>
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setIsExpenseMonthDropdownOpen((open) => !open)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                      style={{ background: themeTokens.hover, color: themeTokens.text }}
                    >
                      {selectedExpenseMonth ?? "—"}
                      <ChevronDown size={11} className={`transition-transform ${isExpenseMonthDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isExpenseMonthDropdownOpen && (
                      <div
                        className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[120px]"
                        style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}
                      >
                        {availableExpenseMonths.map((month) => (
                          <button
                            key={month}
                            onClick={() => {
                              setSelectedExpenseMonth(month);
                              setIsExpenseMonthDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:opacity-80"
                            style={{ color: month === selectedExpenseMonth ? "#ef4444" : themeTokens.text }}
                          >
                            {month}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                )}
              </div>
              {expenseByCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={expenseByCategoryData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis dataKey="category" tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<CustomTooltip themeTokens={themeTokens} />} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="amount" name="Spending" radius={[7,7,0,0]} fill="#ef4444" fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState themeTokens={themeTokens} message="No spending recorded yet." />}
            </div>
          </div>
        )}

        {/* ── BALANCE TAB ─────────────────────────────────────────────── */}
        {activeTab === "balance" && (
          <div className="space-y-4 sm:space-y-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: themeTokens.muted }}>
                  Balance
                </h2>
                <p className="text-xs" style={{ color: themeTokens.muted }}>
                  Showing data for {selectedYear ?? "—"}
                </p>
              </div>
              {availableYears.length > 0 && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setIsBalanceYearDropdownOpen((open) => !open)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                    style={{ background: themeTokens.hover, color: themeTokens.text }}
                  >
                    {selectedYear ?? "—"}
                    <ChevronDown size={11} className={`transition-transform ${isBalanceYearDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isBalanceYearDropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[90px]"
                      style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}
                    >
                      {availableYears.map((year) => (
                        <button
                          key={year}
                          onClick={() => {
                            setSelectedYear(year);
                            setIsBalanceYearDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:opacity-80"
                          style={{ color: year === selectedYear ? "#6366f1" : themeTokens.text }}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Net Balance" value={`৳ ${netBalanceThisYear.toLocaleString()}`} subtitle={selectedYear?.toString()} icon={PiggyBank} accentColor={netBalanceThisYear >= 0 ? "#10b981" : "#f43f5e"} themeTokens={themeTokens} />
              <StatCard label="Savings Rate" value={`${savingsRateThisYear}%`} subtitle="Income saved" icon={Target} accentColor="#6366f1" themeTokens={themeTokens} />
              <StatCard label="Surplus Months" value={surplusMonths.toString()} subtitle="Income > spending" icon={CheckCircle} accentColor="#10b981" themeTokens={themeTokens} />
              <StatCard label="Deficit Months" value={deficitMonths.toString()} subtitle="Spending > income" icon={AlertTriangle} accentColor="#f43f5e" themeTokens={themeTokens} />
            </div>

            <div className="rounded-2xl p-4 sm:p-6" style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}>
              <SectionHeader title="Income vs Spending" subtitle="Side-by-side monthly comparison" themeTokens={themeTokens} />
              {balanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={balanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis dataKey="shortLabel" tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<CustomTooltip themeTokens={themeTokens} />} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="income" name="Income" fill="#10b981" fillOpacity={0.75} radius={[4,4,0,0]} barSize={16} />
                    <Bar dataKey="spending" name="Spending" fill="#f43f5e" fillOpacity={0.75} radius={[4,4,0,0]} barSize={16} />
                    <Legend wrapperStyle={{ fontSize: 11, color: themeTokens.muted }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <EmptyState themeTokens={themeTokens} message="Add income and spending data to see the balance comparison." />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="rounded-2xl p-4 sm:p-6" style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}>
                <SectionHeader title="Monthly Net (Income − Spending)" subtitle="Positive = surplus, negative = deficit" themeTokens={themeTokens} />
                {balanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={balanceData} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                      <XAxis dataKey="shortLabel" tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} width={38} />
                      <Tooltip content={<CustomTooltip themeTokens={themeTokens} />} cursor={{ fill: "transparent" }} />
                      <ReferenceLine y={0} stroke={themeTokens.border} />
                      <Bar dataKey="net" name="Net" radius={[4,4,0,0]}>
                        {balanceData.map((entry, i) => (
                          <Cell key={i} fill={entry.net >= 0 ? "#10b981" : "#f43f5e"} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState themeTokens={themeTokens} />}
              </div>

              <div className="rounded-2xl p-4 sm:p-6" style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}>
                <SectionHeader title="Cumulative Balance" subtitle="Running total of net savings" themeTokens={themeTokens} />
                {cumulativeBalance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={cumulativeBalance}>
                      <defs>
                        <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                      <XAxis dataKey="label" tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} width={38} />
                      <Tooltip content={<CustomTooltip themeTokens={themeTokens} />} cursor={{ fill: "transparent" }} />
                      <ReferenceLine y={0} stroke={themeTokens.border} />
                      <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#6366f1" strokeWidth={2} fill="url(#cumGrad)" dot={{ fill: "#6366f1", r: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <EmptyState themeTokens={themeTokens} />}
              </div>
            </div>

            {bestSavingsMonth && bestSavingsMonth.net > 0 && (
              <div className="rounded-2xl p-4 sm:p-6" style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}>
                <SectionHeader title="Best Savings Month" subtitle="Month with the highest net balance" themeTokens={themeTokens} />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#10b98120" }}>
                    <PiggyBank size={26} style={{ color: "#10b981" }} />
                  </div>
                  <div>
                    <div className="text-xl font-black" style={{ color: themeTokens.text }}>{bestSavingsMonth.shortLabel}</div>
                    <div className="text-sm font-semibold mt-0.5" style={{ color: "#10b981" }}>+৳ {bestSavingsMonth.net.toLocaleString()} saved</div>
                    <div className="text-xs mt-0.5" style={{ color: themeTokens.muted }}>
                      Income ৳{bestSavingsMonth.income.toLocaleString()} · Spending ৳{bestSavingsMonth.spending.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
