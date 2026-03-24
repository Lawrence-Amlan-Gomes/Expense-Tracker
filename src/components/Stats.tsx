"use client";

import React, { useEffect, useState, useMemo } from "react";
import { findUserByEmail } from "@/app/actions";
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
  Sparkles,
  ChevronDown,
  DollarSign,
  PiggyBank,
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  ComposedChart,
  ReferenceLine,
} from "recharts";


// =============================================================================
// SECTION 1: TYPE DEFINITIONS
// =============================================================================
// All TypeScript types/interfaces used throughout this component.

/** Which tab is currently active. */
type ViewTab = "overview" | "monthly" | "categories" | "income" | "balance" | "insights";

/** A single sub-item inside a spending entry (e.g. "Rice: 200", "Oil: 150"). */
interface SubItem {
  name: string;
  cost: number;
}

/**
 * A flattened spending entry — one row per spending item across all months.
 * We flatten the nested month→spendings structure so it's easier to filter,
 * group, and calculate stats.
 */
interface FlatSpending {
  monthName: string;    // e.g. "January 2025"
  date: string;         // day of month, e.g. "15"
  displayName: string;  // the item's display name
  subItems: SubItem[];  // breakdown of sub-costs inside the item
  totalCost: number;    // total cost of this spending entry
}

/** Data shape for a single month in the bar/line charts. */
interface MonthlyTotal {
  shortLabel: string;   // e.g. "Jan '25" — used as the chart axis label
  fullName: string;     // e.g. "January 2025" — used in tables
  total: number;        // total spending for that month
  entryCount: number;   // how many spending entries that month
}

/** Data shape for the radar chart. */
interface RadarDataPoint {
  month: string;
  spending: number;
  average: number;
}

/** Data shape for the category donut/ranking. */
interface CategoryTotal {
  name: string;
  value: number;
}

/** Data shape for the weekly breakdown chart. */
interface WeeklyTotal {
  label: string;  // e.g. "Jan '25 W1"
  total: number;
}

/** Data shape for the daily average chart. */
interface DailyAverage {
  day: string;
  average: number;
}

/** A single insight generated from the data. */
interface Insight {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  body: string;
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

/** Colors used for pie chart slices, bar chart cells, and category rankings. */
const PIE_COLORS = [
  "#6366f1", "#f43f5e", "#10b981", "#f59e0b",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#06b6d4",
];

/** Tab definitions for the navigation bar. */
const MONTH_ORDER = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const TAB_DEFINITIONS: { id: ViewTab; label: string; icon: React.ElementType }[] = [
  { id: "overview",   label: "Overview",   icon: Activity   },
  { id: "monthly",    label: "Monthly",    icon: BarChart3  },
  { id: "categories", label: "Categories", icon: PieChart   },
  { id: "income",     label: "Income",     icon: DollarSign },
  { id: "balance",    label: "Balance",    icon: PiggyBank  },
  { id: "insights",   label: "Insights",   icon: Sparkles   },
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
 * Parse a spending item string into a structured object.
 *
 * Spending items can be stored as either:
 *   - A plain string like "Rice"
 *   - A JSON string like '{"Name":"Groceries","Rice":200,"Oil":150}'
 *
 * This function tries to parse it as JSON first. If that fails (or it's not
 * an object with a "Name" key), it falls back to treating it as a plain string.
 *
 * @param itemString - The raw item string from the database
 * @returns A parsed object with at least a `Name` property
 */
function parseSpendingItem(itemString: string): { Name: string; [key: string]: number | string } {
  try {
    const parsed = JSON.parse(itemString);

    // Only accept it if it's a real object with a "Name" field
    const isValidObject =
      typeof parsed === "object" &&
      parsed !== null &&
      "Name" in parsed;

    if (isValidObject) {
      return parsed;
    }

    // If parsing succeeded but it's not the shape we expect, fall back
    throw new Error("Not a valid spending item object");
  } catch {
    // Not valid JSON or not the right shape — treat as a plain name
    return { Name: itemString };
  }
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

// ─── Insight Card ────────────────────────────────────────────────────────────

interface InsightCardProps {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  body: string;
  themeTokens: ThemeTokens;
}

/**
 * A card used in the Insights tab to show financial advice/observations.
 * Each card type has a distinct icon and color.
 */
function InsightCard({ type, title, body, themeTokens }: InsightCardProps) {
  // Map each insight type to its icon and color
  const insightStyles = {
    warning: { icon: AlertTriangle, color: "#f59e0b", background: "#f59e0b15" },
    success: { icon: CheckCircle,   color: "#10b981", background: "#10b98115" },
    info:    { icon: Activity,      color: "#6366f1", background: "#6366f115" },
    tip:     { icon: Sparkles,      color: "#ec4899", background: "#ec489915" },
  };

  const { icon: IconComponent, color, background } = insightStyles[type];

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4"
      style={{
        background: themeTokens.card,
        border: `1px solid ${themeTokens.border}`,
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ background }}
      >
        <IconComponent size={18} style={{ color }} />
      </div>

      {/* Text content */}
      <div>
        <div className="font-bold text-sm mb-1" style={{ color: themeTokens.text }}>
          {title}
        </div>
        <div className="text-xs leading-relaxed" style={{ color: themeTokens.muted }}>
          {body}
        </div>
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
}: {
  title: string;
  subtitle: string;
  themeTokens: ThemeTokens;
}) {
  return (
    <>
      <h2
        className="text-xs font-black uppercase tracking-widest mb-0.5"
        style={{ color: themeTokens.muted }}
      >
        {title}
      </h2>
      <p
        className="text-xs mb-4 sm:mb-6"
        style={{ color: themeTokens.muted }}
      >
        {subtitle}
      </p>
    </>
  );
}


// =============================================================================
// SECTION 5: DATA PROCESSING FUNCTIONS
// =============================================================================
// Pure functions that transform raw month data into chart-ready structures.
// These are called inside useMemo hooks in the main component.

/**
 * Flatten the nested months→spendings structure into a flat array.
 *
 * Input shape:
 *   months = [{ name: "January 2025", spendings: [{ item: '{"Name":"Groceries","Rice":200}', cost: 200, date: "5" }] }]
 *
 * Output shape:
 *   [{ monthName: "January 2025", date: "5", displayName: "Groceries", subItems: [{name:"Rice", cost:200}], totalCost: 200 }]
 */
function buildFlatSpendings(months: IMonth[]): FlatSpending[] {
  const results: FlatSpending[] = [];

  for (const month of months) {
    for (const spending of month.spendings) {
      const parsed = parseSpendingItem(spending.item);

      // Extract sub-items: every key except "Name" is a sub-item
      // e.g. { Name: "Groceries", Rice: 200, Oil: 150 } → [{ name: "Rice", cost: 200 }, { name: "Oil", cost: 150 }]
      const subItems: SubItem[] = Object.entries(parsed)
        .filter(([key]) => key !== "Name")
        .map(([name, cost]) => ({ name, cost: Number(cost) }));

      results.push({
        monthName: month.name,
        date: spending.date,
        displayName: parsed.Name as string,
        subItems,
        totalCost: spending.cost,
      });
    }
  }

  return results;
}

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
 * Calculate total spending per month across ALL months (all years),
 * sorted chronologically. Used for the "All-Time Spending Trend" chart.
 */
function calculateAllTimeMonthlyTotals(
  months: IMonth[]
): { name: string; total: number }[] {
  // Sort all months by date first
  const sortedMonths = [...months].sort(
    (a, b) => monthNameToDate(a.name).getTime() - monthNameToDate(b.name).getTime()
  );

  return sortedMonths.map((month) => ({
    name: formatShortMonth(month.name),
    total: month.spendings.reduce((sum, spending) => sum + spending.cost, 0),
  }));
}

/**
 * Group spending by category (sub-item name) for a given year.
 * Returns the top 10 categories sorted by total spend, descending.
 */
function calculateCategoryTotals(
  flatSpendings: FlatSpending[],
  selectedYear: number
): CategoryTotal[] {
  const categoryMap = new Map<string, number>();

  // Filter to the selected year
  const spendingsForYear = flatSpendings.filter((spending) => {
    const year = new Date(spending.monthName + " 1").getFullYear();
    return year === selectedYear;
  });

  for (const spending of spendingsForYear) {
    if (spending.subItems.length > 0) {
      // If the item has sub-items, count each sub-item as its own category
      for (const subItem of spending.subItems) {
        const currentTotal = categoryMap.get(subItem.name) || 0;
        categoryMap.set(subItem.name, currentTotal + subItem.cost);
      }
    } else {
      // No sub-items — use the display name as the category
      const currentTotal = categoryMap.get(spending.displayName) || 0;
      categoryMap.set(spending.displayName, currentTotal + spending.totalCost);
    }
  }

  // Convert map to array, sort by value descending, take top 10
  return [...categoryMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

/**
 * Break down spending into weekly buckets for each month.
 *
 * Each month is split into 4 "weeks":
 *   - W1: days 1–7
 *   - W2: days 8–14
 *   - W3: days 15–21
 *   - W4: days 22–31
 *
 * Only weeks with spending > 0 are included.
 */
function calculateWeeklyBreakdown(monthsForYear: IMonth[]): WeeklyTotal[] {
  const weeks: WeeklyTotal[] = [];

  for (const month of monthsForYear) {
    // Sort spendings by day number for clarity
    const sortedSpendings = [...month.spendings].sort(
      (a, b) => parseInt(a.date) - parseInt(b.date)
    );

    // Define the 4 week ranges
    const weekRanges = [
      { label: "W1", minDay: 1,  maxDay: 7  },
      { label: "W2", minDay: 8,  maxDay: 14 },
      { label: "W3", minDay: 15, maxDay: 21 },
      { label: "W4", minDay: 22, maxDay: 31 },
    ];

    const monthShortLabel = formatShortMonth(month.name);

    for (const week of weekRanges) {
      // Sum spending entries that fall within this week's day range
      const weekTotal = sortedSpendings
        .filter((spending) => {
          const dayNumber = parseInt(spending.date);
          return dayNumber >= week.minDay && dayNumber <= week.maxDay;
        })
        .reduce((sum, spending) => sum + spending.cost, 0);

      // Only add weeks that have spending data
      if (weekTotal > 0) {
        weeks.push({
          label: `${monthShortLabel} ${week.label}`,
          total: weekTotal,
        });
      }
    }
  }

  return weeks;
}

/**
 * Calculate the average spending per day-of-month across all months in the year.
 *
 * For example, if January 5th had ৳500 and February 5th had ৳300,
 * day 5 would have an average of ৳400.
 *
 * Only days that have at least one spending entry are included.
 */
function calculateDailyAverages(monthsForYear: IMonth[]): DailyAverage[] {
  // Map each day number (1-31) to an array of all spending amounts on that day
  const dayToCosts = new Map<number, number[]>();

  for (const month of monthsForYear) {
    for (const spending of month.spendings) {
      const dayNumber = parseInt(spending.date);

      if (!isNaN(dayNumber)) {
        const existingCosts = dayToCosts.get(dayNumber) || [];
        existingCosts.push(spending.cost);
        dayToCosts.set(dayNumber, existingCosts);
      }
    }
  }

  // Build an array for days 1–31, calculate average for each
  const dailyAverages: DailyAverage[] = [];

  for (let day = 1; day <= 31; day++) {
    const costsForDay = dayToCosts.get(day);

    if (costsForDay && costsForDay.length > 0) {
      const totalForDay = costsForDay.reduce((sum, cost) => sum + cost, 0);
      const averageForDay = Math.round(totalForDay / costsForDay.length);

      dailyAverages.push({
        day: day.toString(),
        average: averageForDay,
      });
    }
  }

  return dailyAverages;
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
function calculateMonthlyIncome(income: IIncome[], year: number) {
  return income
    .filter((i) => i.year === year)
    .sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month))
    .map((i) => ({
      shortLabel: formatShortMonth(`${i.month} ${year}`),
      fullName: `${i.month} ${year}`,
      monthName: i.month,
      income: i.amount,
    }));
}

function calculateAllTimeIncome(income: IIncome[]) {
  return [...income]
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month);
    })
    .map((i) => ({
      name: formatShortMonth(`${i.month} ${i.year}`),
      total: i.amount,
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

/**
 * Generate financial insights based on spending patterns.
 *
 * Each insight is a card with a type (warning/success/info/tip),
 * a title, and a body message. We analyze:
 *   1. Month-over-month spending spikes or savings
 *   2. Whether a single category dominates the budget
 *   3. Monthly budget benchmark with 10% reduction target
 *   4. Highest-spending week
 *   5. 3-month rising or declining trends
 *
 * Note: All comparisons use `completedMonthlyTotals` which excludes
 * the current incomplete month, so insights reflect finished data only.
 */
function generateInsights(
  completedMonthlyTotals: MonthlyTotal[],
  categoryData: CategoryTotal[],
  totalThisYear: number,
  averagePerCompletedMonth: number,
  weeklyData: WeeklyTotal[],
  monthlyIncome: { fullName: string; income: number }[],
  balanceData: { fullName: string; income: number; spending: number; net: number }[]
): Insight[] {
  const insights: Insight[] = [];

  // ── Insight 1: Month-over-month spike or savings ──────────────────────────
  if (completedMonthlyTotals.length >= 2) {
    const latestCompletedMonth = completedMonthlyTotals[completedMonthlyTotals.length - 1];
    const previousMonth = completedMonthlyTotals[completedMonthlyTotals.length - 2];

    // Calculate percentage change
    const percentChange = previousMonth.total > 0
      ? Math.round(((latestCompletedMonth.total - previousMonth.total) / previousMonth.total) * 100)
      : 0;

    if (percentChange > 20) {
      insights.push({
        type: "warning",
        title: `Spending Spike in ${latestCompletedMonth.shortLabel}`,
        body: `Your spending jumped ${percentChange}% compared to ${previousMonth.shortLabel}. Review your largest categories to identify what drove this increase.`,
      });
    } else if (percentChange < -15) {
      insights.push({
        type: "success",
        title: `Great Savings in ${latestCompletedMonth.shortLabel}!`,
        body: `You reduced spending by ${Math.abs(percentChange)}% vs ${previousMonth.shortLabel}. Keep this momentum going — consistency builds wealth.`,
      });
    }
  }

  // ── Insight 2: Dominant category ──────────────────────────────────────────
  if (categoryData.length > 0) {
    const topCategory = categoryData[0];
    const categoryPercentOfTotal = totalThisYear > 0
      ? Math.round((topCategory.value / totalThisYear) * 100)
      : 0;

    if (categoryPercentOfTotal > 30) {
      insights.push({
        type: "warning",
        title: `"${topCategory.name}" Dominates Your Budget`,
        body: `${categoryPercentOfTotal}% of yearly spending goes to "${topCategory.name}". Consider if this aligns with your financial priorities.`,
      });
    }
  }

  // ── Insight 3: Monthly budget benchmark ───────────────────────────────────
  if (averagePerCompletedMonth > 0) {
    const tenPercentReduction = Math.round(averagePerCompletedMonth * 0.9);
    const yearlySavings = Math.round(averagePerCompletedMonth * 0.1 * 12);

    insights.push({
      type: "info",
      title: "Monthly Budget Benchmark",
      body: `Your average monthly spend is ৳${averagePerCompletedMonth.toLocaleString()}. A 10% reduction target of ৳${tenPercentReduction.toLocaleString()} could save ৳${yearlySavings.toLocaleString()} per year.`,
    });
  }

  // ── Insight 4: Highest-spending week ──────────────────────────────────────
  if (weeklyData.length > 0) {
    // Find the week with the highest total
    const highestWeek = [...weeklyData].sort((a, b) => b.total - a.total)[0];

    insights.push({
      type: "tip",
      title: `Highest Spending: ${highestWeek.label}`,
      body: `You tend to spend most during ${highestWeek.label} (৳${highestWeek.total.toLocaleString()}). Planning purchases earlier in the month could improve budget control.`,
    });
  }

  // ── Insight 5: 3-month trend (rising or declining) ────────────────────────
  if (completedMonthlyTotals.length >= 3) {
    const lastThreeMonths = completedMonthlyTotals.slice(-3).map((month) => month.total);
    const [oldest, middle, newest] = lastThreeMonths;

    const isRising = oldest < middle && middle < newest;
    const isDeclining = oldest > middle && middle > newest;

    if (isRising) {
      insights.push({
        type: "warning",
        title: "3-Month Rising Trend",
        body: "Your spending has increased for 3 consecutive months. This pattern can erode savings quickly if unchecked.",
      });
    } else if (isDeclining) {
      insights.push({
        type: "success",
        title: "3-Month Declining Trend",
        body: "Congratulations! Spending has decreased for 3 consecutive months. You're building strong financial discipline.",
      });
    }
  }

  // ── Income vs spending — savings rate ─────────────────────────────────────
  if (monthlyIncome.length > 0) {
    const completedBalance = balanceData.filter(
      (b) => !isCurrentMonth(b.fullName) && b.income > 0
    );
    if (completedBalance.length > 0) {
      const totalInc = completedBalance.reduce((s, b) => s + b.income, 0);
      const totalSpend = completedBalance.reduce((s, b) => s + b.spending, 0);
      const rate = totalInc > 0 ? Math.round(((totalInc - totalSpend) / totalInc) * 100) : 0;
      if (rate < 0) {
        insights.push({
          type: "warning",
          title: "Spending Exceeds Income",
          body: `You are spending ${Math.abs(rate)}% more than you earn on average. Review your budget urgently.`,
        });
      } else if (rate >= 20) {
        insights.push({
          type: "success",
          title: `Excellent Savings Rate: ${rate}%`,
          body: `You save ${rate}% of your income on average — above the recommended 20% threshold.`,
        });
      } else {
        insights.push({
          type: "info",
          title: `Savings Rate: ${rate}%`,
          body: `You save ${rate}% of income. Aim for at least 20% by reducing discretionary spending.`,
        });
      }
    }
    const deficitCount = balanceData.filter((b) => b.income > 0 && b.net < 0).length;
    if (deficitCount > 0) {
      insights.push({
        type: deficitCount >= 2 ? "warning" : "info",
        title: `${deficitCount} Month${deficitCount > 1 ? "s" : ""} Over Budget`,
        body: `In ${deficitCount} month${deficitCount > 1 ? "s" : ""} this year, spending exceeded income.`,
      });
    }
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "Add More Data for Insights",
      body: "Track at least 2–3 months of spending and income to unlock personalized financial insights.",
    });
  }

  return insights;
}


// =============================================================================
// SECTION 6: MAIN COMPONENT
// =============================================================================

export default function Stats() {
  // ── External hooks ────────────────────────────────────────────────────────
  const { theme } = useTheme();
  const { user: authUser, setAuth } = useAuth();
  const router = useRouter();

  // ── Local state ───────────────────────────────────────────────────────────
  const [hasMounted, setHasMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("overview");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [allMonths, setAllMonths] = useState<IMonth[]>([]);
  const [allIncome, setAllIncome] = useState<IIncome[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const themeTokens = getThemeTokens(theme);

  // ── Mount ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasMounted) return;
    if (authUser === null) {
      // check localStorage directly before redirecting
      const stored = localStorage.getItem("authUser");
      if (!stored) {
        router.push("/login");
      }
    }
  }, [authUser, hasMounted, router]);

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
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMounted]);

  // ── Derived / computed data ───────────────────────────────────────────────
  // Each `useMemo` caches its result and only recalculates when its
  // dependencies change. This prevents expensive re-computation on every render.

  /** Flat array of all spending entries across all months. */
  const flatSpendings = useMemo(
    () => buildFlatSpendings(allMonths),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allMonths]
  );

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
   *   - Insights (spike/savings, 3-month trend)
   *   - Radar chart average line
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

  /** All-time monthly totals across all years (for the overview area chart). */
  const allTimeMonthlyTotals = useMemo(
    () => calculateAllTimeMonthlyTotals(allMonths),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allMonths]
  );

  /** Top 10 spending categories for the selected year. */
  const categoryData = useMemo(
    () => (selectedYear !== null ? calculateCategoryTotals(flatSpendings, selectedYear) : []),
    [flatSpendings, selectedYear]
  );

  /** Weekly breakdown for the selected year. */
  const weeklyData = useMemo(
    () => calculateWeeklyBreakdown(monthsForYear),
    [monthsForYear]
  );

  /** Average spending per day-of-month for the selected year. */
  const dailyAverages = useMemo(
    () => calculateDailyAverages(monthsForYear),
    [monthsForYear]
  );

  const monthlyIncome = useMemo(
    () => (selectedYear !== null ? calculateMonthlyIncome(allIncome, selectedYear) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allIncome, selectedYear]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allTimeIncome = useMemo(() => calculateAllTimeIncome(allIncome), [allIncome]);

  const balanceData = useMemo(
    () => calculateBalanceData(monthlyTotals, monthlyIncome),
    [monthlyTotals, monthlyIncome]
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

  /**
   * Radar chart data — last 6 months of the selected year.
   * The "average" line uses `averagePerMonth` (from completed months only).
   */
  const radarData: RadarDataPoint[] = useMemo(
    () =>
      monthlyTotals.slice(-6).map((month) => ({
        month: month.shortLabel,
        spending: month.total,
        average: averagePerMonth,
      })),
    [monthlyTotals, averagePerMonth]
  );

  /**
   * Financial insights — generated from COMPLETED months only.
   * This ensures insights like "spending spike" or "3-month trend"
   * are based on finalized data, not partial current-month data.
   */
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

  const insights = useMemo(
    () => generateInsights(
      completedMonthlyTotals,
      categoryData,
      totalThisYear,
      averagePerMonth,
      weeklyData,
      monthlyIncome,
      balanceData
    ),
    [completedMonthlyTotals, categoryData, totalThisYear, averagePerMonth, weeklyData, monthlyIncome, balanceData]
  );

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

            {/* Stat cards — 2 columns on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Total This Year"
                value={`৳ ${totalThisYear.toLocaleString()}`}
                subtitle={`Across ${monthlyTotals.length} months`}
                icon={Wallet}
                accentColor="#6366f1"
                themeTokens={themeTokens}
                trend="neutral"
              />
              <StatCard
                label="Monthly Average"
                value={`৳ ${averagePerMonth.toLocaleString()}`}
                subtitle="Based on completed months"
                icon={BarChart3}
                accentColor="#10b981"
                themeTokens={themeTokens}
                trend={monthOverMonthTrend}
              />
              <StatCard
                label="Highest Month"
                value={highestMonth.total > 0 ? highestMonth.shortLabel : "—"}
                subtitle={highestMonth.total > 0 ? `৳ ${highestMonth.total.toLocaleString()}` : undefined}
                icon={Flame}
                accentColor="#f43f5e"
                themeTokens={themeTokens}
              />
              <StatCard
                label="Lowest Month"
                value={lowestMonth ? lowestMonth.shortLabel : "—"}
                subtitle={lowestMonth ? `৳ ${lowestMonth.total.toLocaleString()}` : undefined}
                icon={Target}
                accentColor="#f59e0b"
                themeTokens={themeTokens}
              />
            </div>

            {/* All-time spending area chart */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{
                background: themeTokens.card,
                border: `1px solid ${themeTokens.border}`,
              }}
            >
              <SectionHeader
                title="All-Time Spending Trend"
                subtitle="Total monthly spend across all tracked periods"
                themeTokens={themeTokens}
              />
              {allTimeMonthlyTotals.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={allTimeMonthlyTotals}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis
                      dataKey="name"
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
                      cursor={{ fill: "transparent" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#areaGrad)"
                      dot={{ fill: "#6366f1", r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState themeTokens={themeTokens} />
              )}
            </div>

            {/* Weekly + Daily charts — stacked on mobile, side-by-side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Weekly Breakdown */}
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{
                  background: themeTokens.card,
                  border: `1px solid ${themeTokens.border}`,
                }}
              >
                <SectionHeader
                  title="Weekly Breakdown"
                  subtitle="How spending distributes across weeks"
                  themeTokens={themeTokens}
                />
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={weeklyData} barSize={10}>
                      <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: themeTokens.muted, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: themeTokens.muted, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                        width={34}
                      />
                      <Tooltip
                        content={<CustomTooltip themeTokens={themeTokens} />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar dataKey="total" radius={[5, 5, 0, 0]}>
                        {weeklyData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            fillOpacity={0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState themeTokens={themeTokens} />
                )}
              </div>

              {/* Daily Average */}
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{
                  background: themeTokens.card,
                  border: `1px solid ${themeTokens.border}`,
                }}
              >
                <SectionHeader
                  title="Avg Spend by Day of Month"
                  subtitle="Which days you typically spend more"
                  themeTokens={themeTokens}
                />
                {dailyAverages.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dailyAverages} barSize={6}>
                      <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: themeTokens.muted, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        interval={4}
                      />
                      <YAxis
                        tick={{ fill: themeTokens.muted, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                        width={34}
                      />
                      <Tooltip
                        content={<CustomTooltip themeTokens={themeTokens} />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar
                        dataKey="average"
                        fill="#10b981"
                        radius={[3, 3, 0, 0]}
                        fillOpacity={0.8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState themeTokens={themeTokens} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* MONTHLY TAB                                                       */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {activeTab === "monthly" && (
          <div className="space-y-4 sm:space-y-8">

            {/* Bar chart: Monthly spending for the selected year */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{
                background: themeTokens.card,
                border: `1px solid ${themeTokens.border}`,
              }}
            >
              <SectionHeader
                title={`Monthly Spending — ${selectedYear}`}
                subtitle="Total expenditure for each month"
                themeTokens={themeTokens}
              />
              {monthlyTotals.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyTotals} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fill: themeTokens.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
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
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar dataKey="total" name="Spending" radius={[7, 7, 0, 0]}>
                      {monthlyTotals.map((month, index) => (
                        <Cell
                          key={index}
                          fill={month.total === highestMonth.total ? "#f43f5e" : "#6366f1"}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState themeTokens={themeTokens} />
              )}
            </div>

            {/* Line chart: Month-over-month trend with average line */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{
                background: themeTokens.card,
                border: `1px solid ${themeTokens.border}`,
              }}
            >
              <SectionHeader
                title="Month-over-Month Trend"
                subtitle="Spending each month vs. your average"
                themeTokens={themeTokens}
              />
              {monthlyTotals.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyTotals}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fill: themeTokens.muted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
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
                      cursor={{ fill: "transparent" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Spending"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: "#6366f1", r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                    {/* Average reference line (dashed) */}
                    {averagePerMonth > 0 && (
                      <Line
                        type="monotone"
                        dataKey={() => averagePerMonth}
                        name="Average"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    )}
                    <Legend wrapperStyle={{ fontSize: 11, color: themeTokens.muted }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState themeTokens={themeTokens} />
              )}
            </div>

            {/* Summary table — card list on mobile, proper table on desktop */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: themeTokens.card,
                border: `1px solid ${themeTokens.border}`,
              }}
            >
              {/* Table header */}
              <div
                className="p-4 sm:p-6 border-b"
                style={{ borderColor: themeTokens.border }}
              >
                <h2
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: themeTokens.muted }}
                >
                  Month Summary
                </h2>
              </div>

              {monthlyTotals.length > 0 ? (
                <>
                  {/* ── Mobile: Card list ──────────────────────────────────── */}
                  <div
                    className="sm:hidden divide-y"
                    style={{ borderColor: themeTokens.border }}
                  >
                    {monthlyTotals.map((month, index) => {
                      const differenceFromAverage = month.total - averagePerMonth;
                      const shareOfTotal = totalThisYear > 0
                        ? Math.round((month.total / totalThisYear) * 100)
                        : 0;

                      return (
                        <div key={index} className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div
                                className="font-bold text-sm"
                                style={{ color: themeTokens.text }}
                              >
                                {month.fullName}
                              </div>
                              <div
                                className="text-xs mt-0.5"
                                style={{ color: themeTokens.muted }}
                              >
                                {month.entryCount} entries
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className="font-black text-sm"
                                style={{ color: themeTokens.text }}
                              >
                                ৳ {month.total.toLocaleString()}
                              </div>
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: differenceFromAverage > 0 ? "#f43f5e22" : "#10b98122",
                                  color: differenceFromAverage > 0 ? "#f43f5e" : "#10b981",
                                }}
                              >
                                {differenceFromAverage > 0 ? "+" : ""}
                                ৳ {differenceFromAverage.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {/* Share progress bar */}
                          <div className="flex items-center gap-2">
                            <div
                              className="flex-1 h-1.5 rounded-full overflow-hidden"
                              style={{ background: themeTokens.border }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${shareOfTotal}%`, background: "#6366f1" }}
                              />
                            </div>
                            <span
                              className="text-xs w-7 text-right"
                              style={{ color: themeTokens.muted }}
                            >
                              {shareOfTotal}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Desktop: Proper table ─────────────────────────────── */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${themeTokens.border}` }}>
                          {["Month", "Entries", "Total", "vs. Average", "Share"].map(
                            (headerText) => (
                              <th
                                key={headerText}
                                className="text-left px-6 py-3 font-black text-xs uppercase tracking-widest"
                                style={{ color: themeTokens.muted }}
                              >
                                {headerText}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyTotals.map((month, index) => {
                          const differenceFromAverage = month.total - averagePerMonth;
                          const shareOfTotal = totalThisYear > 0
                            ? Math.round((month.total / totalThisYear) * 100)
                            : 0;

                          return (
                            <tr
                              key={index}
                              className="border-b transition-colors"
                              style={{
                                borderColor: themeTokens.border,
                                color: themeTokens.text,
                              }}
                              onMouseEnter={(event) => {
                                event.currentTarget.style.background = themeTokens.hover;
                              }}
                              onMouseLeave={(event) => {
                                event.currentTarget.style.background = "transparent";
                              }}
                            >
                              <td className="px-6 py-4 font-bold">{month.fullName}</td>
                              <td className="px-6 py-4" style={{ color: themeTokens.muted }}>
                                {month.entryCount}
                              </td>
                              <td className="px-6 py-4 font-bold">
                                ৳ {month.total.toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className="text-xs font-bold px-2 py-1 rounded-full"
                                  style={{
                                    background: differenceFromAverage > 0 ? "#f43f5e22" : "#10b98122",
                                    color: differenceFromAverage > 0 ? "#f43f5e" : "#10b981",
                                  }}
                                >
                                  {differenceFromAverage > 0 ? "+" : ""}
                                  ৳ {differenceFromAverage.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                                    style={{ background: themeTokens.border }}
                                  >
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${shareOfTotal}%`,
                                        background: "#6366f1",
                                      }}
                                    />
                                  </div>
                                  <span
                                    className="text-xs w-8 text-right"
                                    style={{ color: themeTokens.muted }}
                                  >
                                    {shareOfTotal}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="p-6">
                  <EmptyState themeTokens={themeTokens} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* CATEGORIES TAB                                                    */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {activeTab === "categories" && (
          <div className="space-y-4 sm:space-y-8">

            {/* Donut chart + Category ranking — stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">

              {/* Donut chart */}
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{
                  background: themeTokens.card,
                  border: `1px solid ${themeTokens.border}`,
                }}
              >
                <SectionHeader
                  title="Spending Distribution"
                  subtitle={`Top categories by total spend in ${selectedYear}`}
                  themeTokens={themeTokens}
                />
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {categoryData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `৳ ${(value as number ?? 0).toLocaleString()}`,
                          "Spent",
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, color: themeTokens.muted }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState themeTokens={themeTokens} />
                )}
              </div>

              {/* Category ranking (horizontal bars) */}
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{
                  background: themeTokens.card,
                  border: `1px solid ${themeTokens.border}`,
                }}
              >
                <SectionHeader
                  title="Category Ranking"
                  subtitle="Your top 10 spending categories"
                  themeTokens={themeTokens}
                />
                <div className="space-y-2 sm:space-y-3">
                  {categoryData.map((category, index) => {
                    // Calculate bar width relative to the top category
                    const barWidthPercent = categoryData[0].value > 0
                      ? Math.round((category.value / categoryData[0].value) * 100)
                      : 0;
                    const barColor = PIE_COLORS[index % PIE_COLORS.length];

                    return (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className="text-xs font-bold truncate max-w-[60%]"
                            style={{ color: themeTokens.text }}
                          >
                            {category.name}
                          </span>
                          <span
                            className="text-xs font-bold"
                            style={{ color: barColor }}
                          >
                            ৳ {category.value.toLocaleString()}
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: themeTokens.border }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${barWidthPercent}%`,
                              background: barColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {categoryData.length === 0 && (
                    <EmptyState themeTokens={themeTokens} />
                  )}
                </div>
              </div>
            </div>

            {/* Radar chart (only shown with 3+ months of data) */}
            {radarData.length >= 3 && (
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{
                  background: themeTokens.card,
                  border: `1px solid ${themeTokens.border}`,
                }}
              >
                <SectionHeader
                  title="Spending Radar (Last 6 Months)"
                  subtitle="Actual vs. monthly average"
                  themeTokens={themeTokens}
                />
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}>
                    <PolarGrid stroke={themeTokens.border} />
                    <PolarAngleAxis
                      dataKey="month"
                      tick={{ fill: themeTokens.muted, fontSize: 10 }}
                    />
                    <Radar
                      name="Spending"
                      dataKey="spending"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Avg"
                      dataKey="average"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.1}
                      strokeDasharray="4 4"
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: themeTokens.muted }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ── INCOME TAB ──────────────────────────────────────────────── */}
        {activeTab === "income" && (
          <div className="space-y-4 sm:space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total Income" value={`৳ ${totalIncomeThisYear.toLocaleString()}`} subtitle={`${selectedYear}`} icon={DollarSign} accentColor="#10b981" themeTokens={themeTokens} />
              <StatCard label="Monthly Average" value={`৳ ${averageMonthlyIncome.toLocaleString()}`} subtitle="Completed months" icon={BarChart3} accentColor="#6366f1" themeTokens={themeTokens} trend={completedIncomeMonths.length >= 2 ? (completedIncomeMonths[completedIncomeMonths.length-1].income > completedIncomeMonths[completedIncomeMonths.length-2].income ? "up" : "down") : "neutral"} trendInverted />
              <StatCard label="Highest Month" value={highestIncomeMonth.income > 0 ? highestIncomeMonth.shortLabel : "—"} subtitle={highestIncomeMonth.income > 0 ? `৳ ${highestIncomeMonth.income.toLocaleString()}` : undefined} icon={Flame} accentColor="#f59e0b" themeTokens={themeTokens} />
              <StatCard label="All-Time Income" value={`৳ ${allTimeIncome.reduce((s, i) => s + i.total, 0).toLocaleString()}`} subtitle={`${allIncome.length} months tracked`} icon={Wallet} accentColor="#8b5cf6" themeTokens={themeTokens} />
            </div>

            <div className="rounded-2xl p-4 sm:p-6" style={{ background: themeTokens.card, border: `1px solid ${themeTokens.border}` }}>
              <SectionHeader title={`Monthly Income — ${selectedYear}`} subtitle="Income recorded each month" themeTokens={themeTokens} />
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
              <SectionHeader title="All-Time Income Trend" subtitle="Income across all tracked periods" themeTokens={themeTokens} />
              {allTimeIncome.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={allTimeIncome}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.border} />
                    <XAxis dataKey="name" tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: themeTokens.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<CustomTooltip themeTokens={themeTokens} />} cursor={{ fill: "transparent" }} />
                    <Area type="monotone" dataKey="total" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" dot={{ fill: "#10b981", r: 2 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyState themeTokens={themeTokens} />}
            </div>
          </div>
        )}

        {/* ── BALANCE TAB ─────────────────────────────────────────────── */}
        {activeTab === "balance" && (
          <div className="space-y-4 sm:space-y-8">
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

        {/* ── INSIGHTS TAB ────────────────────────────────────────────── */}
        {activeTab === "insights" && (
          <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">

            {/* Insights header */}
            <div className="text-center mb-6 sm:mb-10">
              <div
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-3 sm:mb-4"
                style={{ background: "#6366f115", color: "#6366f1" }}
              >
                <Sparkles size={12} /> AI-Powered Analysis
              </div>
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{ color: themeTokens.text }}
              >
                Your Financial Insights
              </h2>
              <p
                className="text-xs sm:text-sm mt-2"
                style={{ color: themeTokens.muted }}
              >
                Personalized observations based on your spending data
              </p>
            </div>

            {/* Insight cards */}
            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                type={insight.type}
                title={insight.title}
                body={insight.body}
                themeTokens={themeTokens}
              />
            ))}

            {/* Summary statistics pills */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
              {[
                {
                  value: allMonths.length,
                  label: "Months Tracked",
                  color: "#6366f1",
                },
                {
                  value: allMonths.reduce(
                    (sum, month) => sum + month.spendings.length,
                    0
                  ),
                  label: "Total Spending Entries",
                  color: "#10b981",
                },
                {
                  value: categoryData.length,
                  label: `Unique Categories (${selectedYear})`,
                  color: "#f59e0b",
                },
                {
                  value: availableYears.length,
                  label: "Years of Data",
                  color: "#f43f5e",
                },
              ].map((pill, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-4 sm:p-5 text-center"
                  style={{
                    background: themeTokens.card,
                    border: `1px solid ${themeTokens.border}`,
                  }}
                >
                  <div
                    className="text-2xl sm:text-3xl font-black"
                    style={{ color: pill.color }}
                  >
                    {pill.value}
                  </div>
                  <div
                    className="text-xs uppercase tracking-widest mt-1 leading-tight"
                    style={{ color: themeTokens.muted }}
                  >
                    {pill.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
