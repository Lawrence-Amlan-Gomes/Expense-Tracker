"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { useRouter } from "next/navigation";
import { IMonth } from "@/store/features/auth/authSlice";
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
} from "recharts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseItem(item: string): { Name: string; [key: string]: number | string } {
  try {
    const parsed = JSON.parse(item);
    if (typeof parsed === "object" && parsed !== null && "Name" in parsed) return parsed;
    throw new Error();
  } catch {
    return { Name: item };
  }
}

function monthToDate(name: string): Date {
  return new Date(name + " 1");
}

function shortMonth(name: string): string {
  return new Date(name + " 1").toLocaleString("default", { month: "short", year: "2-digit" });
}

const PIE_COLORS = [
  "#6366f1", "#f43f5e", "#10b981", "#f59e0b",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#06b6d4",
];

// ─── Theme tokens
// theme === true  → LIGHT (white bg, black text)
// theme === false → DARK  (black bg, white text)

function tk(theme: boolean) {
  return {
    bg:     theme ? "#f5f5f7" : "#000000",
    card:   theme ? "#ffffff" : "#0d0d0d",
    border: theme ? "#e8e8e8" : "#1e1e1e",
    text:   theme ? "#000000" : "#ffffff",
    muted:  theme ? "#999999" : "#555555",
    hover:  theme ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "overview" | "monthly" | "categories" | "insights";

interface SubItem { name: string; cost: number }
interface FlatSpending {
  monthName: string; date: string; displayName: string;
  subItems: SubItem[]; totalCost: number;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active, payload, label, theme,
}: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string; theme: boolean }) {
  const t = tk(theme);
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl shadow-2xl text-xs"
      style={{ background: t.card, border: `1px solid ${t.border}`, color: t.text }}>
      {label && <div className="font-bold mb-1 uppercase tracking-widest" style={{ color: t.muted }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span style={{ color: t.muted }}>{p.name || "Spending"}:</span>
          <span className="font-bold">৳ {p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, trend, accent, theme }: {
  label: string; value: string; sub?: string; icon: React.ElementType;
  trend?: "up" | "down" | "neutral"; accent: string; theme: boolean;
}) {
  const t = tk(theme);
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 sm:p-6 transition-all hover:scale-[1.02]"
      style={{ background: t.card, border: `1px solid ${t.border}` }}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl" style={{ background: accent }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: accent + "22" }}>
            <Icon size={18} style={{ color: accent }} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full" style={{
              background: trend === "up" ? "#f43f5e22" : trend === "down" ? "#10b98122" : "#55555522",
              color: trend === "up" ? "#f43f5e" : trend === "down" ? "#10b981" : t.muted,
            }}>
              {trend === "up" ? <TrendingUp size={11} /> : trend === "down" ? <TrendingDown size={11} /> : null}
              <span className="hidden sm:inline">{trend === "up" ? "Higher" : trend === "down" ? "Lower" : "Stable"}</span>
            </div>
          )}
        </div>
        <div className="text-lg sm:text-2xl font-black tracking-tight leading-tight" style={{ color: t.text }}>{value}</div>
        <div className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: t.muted }}>{label}</div>
        {sub && <div className="text-xs mt-1 hidden sm:block" style={{ color: t.muted }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ type, title, body, theme }: {
  type: "warning" | "success" | "info" | "tip"; title: string; body: string; theme: boolean;
}) {
  const t = tk(theme);
  const cfg = {
    warning: { icon: AlertTriangle, color: "#f59e0b", bg: "#f59e0b15" },
    success: { icon: CheckCircle,   color: "#10b981", bg: "#10b98115" },
    info:    { icon: Activity,      color: "#6366f1", bg: "#6366f115" },
    tip:     { icon: Sparkles,      color: "#ec4899", bg: "#ec489915" },
  }[type];
  const Icon = cfg.icon;
  return (
    <div className="rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4"
      style={{ background: t.card, border: `1px solid ${t.border}` }}>
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: cfg.bg }}>
        <Icon size={18} style={{ color: cfg.color }} />
      </div>
      <div>
        <div className="font-bold text-sm mb-1" style={{ color: t.text }}>{title}</div>
        <div className="text-xs leading-relaxed" style={{ color: t.muted }}>{body}</div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ theme }: { theme: boolean }) {
  const t = tk(theme);
  return (
    <div className="flex flex-col items-center justify-center h-32 sm:h-40 gap-3" style={{ color: t.muted }}>
      <BarChart3 size={28} className="opacity-30" />
      <p className="text-sm font-medium opacity-50">No data to display yet</p>
      <p className="text-xs opacity-30 hidden sm:block">Add spending entries to see charts</p>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub, theme }: { title: string; sub: string; theme: boolean }) {
  const t = tk(theme);
  return (
    <>
      <h2 className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: t.muted }}>{title}</h2>
      <p className="text-xs mb-4 sm:mb-6" style={{ color: t.muted }}>{sub}</p>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Stats() {
  const { theme } = useTheme();     // true = LIGHT, false = DARK
  const { user: auth } = useAuth();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const t = tk(theme);

  useEffect(() => { setHasMounted(true); }, []);
  useEffect(() => { if (hasMounted && auth === null) router.push("/login"); }, [auth, hasMounted, router]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const months: IMonth[] = auth?.money?.Months || [];

  // ── Derived data ──────────────────────────────────────────────────────────

  const flatSpendings: FlatSpending[] = useMemo(() =>
    months.flatMap((m) =>
      m.spendings.map((s) => {
        const parsed = parseItem(s.item);
        const subItems = Object.entries(parsed).filter(([k]) => k !== "Name").map(([name, cost]) => ({ name, cost: Number(cost) }));
        return { monthName: m.name, date: s.date, displayName: parsed.Name as string, subItems, totalCost: s.cost };
      })
    ), [months]);

  const availableYears = useMemo(() => {
    const years = new Set(
      months
        .map((m) => new Date(m.name + " 1").getFullYear())
        .filter((y) => !isNaN(y) && y > 2000 && y < 2100),
    );
    return [...years].sort((a, b) => b - a);
  }, [months]);

  useEffect(() => {
    if (availableYears.length > 0 && selectedYear === null) setSelectedYear(availableYears[0]);
  }, [availableYears, selectedYear]);

  const monthsForYear = useMemo(() =>
    months.filter((m) => new Date(m.name + " 1").getFullYear() === selectedYear)
      .sort((a, b) => monthToDate(a.name).getTime() - monthToDate(b.name).getTime()),
    [months, selectedYear]);

  const monthlyTotals = useMemo(() =>
    monthsForYear.map((m) => ({
      name: shortMonth(m.name), fullName: m.name,
      total: m.spendings.reduce((s, sp) => s + sp.cost, 0),
      count: m.spendings.length,
    })), [monthsForYear]);

  const allMonthlyTotals = useMemo(() =>
    [...months].sort((a, b) => monthToDate(a.name).getTime() - monthToDate(b.name).getTime())
      .map((m) => ({ name: shortMonth(m.name), total: m.spendings.reduce((s, sp) => s + sp.cost, 0) })),
    [months]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    flatSpendings.filter((f) => new Date(f.monthName + " 1").getFullYear() === selectedYear).forEach((f) => {
      f.subItems.forEach((si) => map.set(si.name, (map.get(si.name) || 0) + si.cost));
      if (f.subItems.length === 0) map.set(f.displayName, (map.get(f.displayName) || 0) + f.totalCost);
    });
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [flatSpendings, selectedYear]);

  const totalThisYear = monthlyTotals.reduce((s, m) => s + m.total, 0);
  const avgPerMonth   = monthlyTotals.length ? Math.round(totalThisYear / monthlyTotals.length) : 0;
  const maxMonth      = monthlyTotals.reduce((a, b) => b.total > a.total ? b : a, { name: "-", total: 0, fullName: "-", count: 0 });
  const minMonthCandidates = monthlyTotals.filter((m) => m.total > 0);
  const minMonth      = minMonthCandidates.length > 0 ? minMonthCandidates.reduce((a, b) => b.total < a.total ? b : a) : null;

  const lastTwo  = monthlyTotals.slice(-2);
  const momTrend: "up" | "down" | "neutral" = lastTwo.length === 2
    ? lastTwo[1].total > lastTwo[0].total ? "up" : lastTwo[1].total < lastTwo[0].total ? "down" : "neutral"
    : "neutral";

  const weeklyData = useMemo(() => {
    const weeks: { label: string; total: number }[] = [];
    monthsForYear.forEach((m) => {
      const s = [...m.spendings].sort((a, b) => parseInt(a.date) - parseInt(b.date));
      const w1 = s.filter((x) => parseInt(x.date) <=  7).reduce((sum, x) => sum + x.cost, 0);
      const w2 = s.filter((x) => parseInt(x.date) >  7 && parseInt(x.date) <= 14).reduce((sum, x) => sum + x.cost, 0);
      const w3 = s.filter((x) => parseInt(x.date) > 14 && parseInt(x.date) <= 21).reduce((sum, x) => sum + x.cost, 0);
      const w4 = s.filter((x) => parseInt(x.date) > 21).reduce((sum, x) => sum + x.cost, 0);
      const mo = shortMonth(m.name);
      if (w1) weeks.push({ label: `${mo} W1`, total: w1 });
      if (w2) weeks.push({ label: `${mo} W2`, total: w2 });
      if (w3) weeks.push({ label: `${mo} W3`, total: w3 });
      if (w4) weeks.push({ label: `${mo} W4`, total: w4 });
    });
    return weeks;
  }, [monthsForYear]);

  const dailyPattern = useMemo(() => {
    const map = new Map<number, number[]>();
    monthsForYear.forEach((m) => m.spendings.forEach((s) => {
      const d = parseInt(s.date);
      if (!isNaN(d)) { const arr = map.get(d) || []; arr.push(s.cost); map.set(d, arr); }
    }));
    return Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const vals = map.get(day);
      return { day: day.toString(), avg: vals ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0 };
    }).filter((d) => d.avg > 0);
  }, [monthsForYear]);

  const radarData = useMemo(() =>
    monthlyTotals.slice(-6).map((m) => ({ month: m.name, spending: m.total, avg: avgPerMonth })),
    [monthlyTotals, avgPerMonth]);

  const insights = useMemo(() => {
    const ins: { type: "warning" | "success" | "info" | "tip"; title: string; body: string }[] = [];
    if (monthlyTotals.length >= 2) {
      const last = monthlyTotals[monthlyTotals.length - 1];
      const prev = monthlyTotals[monthlyTotals.length - 2];
      const pct  = prev.total > 0 ? Math.round(((last.total - prev.total) / prev.total) * 100) : 0;
      if (pct > 20)    ins.push({ type: "warning", title: `Spending Spike in ${last.name}`, body: `Your spending jumped ${pct}% compared to ${prev.name}. Review your largest categories to identify what drove this increase.` });
      else if (pct < -15) ins.push({ type: "success", title: `Great Savings in ${last.name}!`, body: `You reduced spending by ${Math.abs(pct)}% vs ${prev.name}. Keep this momentum going — consistency builds wealth.` });
    }
    if (categoryData.length > 0) {
      const top = categoryData[0];
      const pct = totalThisYear > 0 ? Math.round((top.value / totalThisYear) * 100) : 0;
      if (pct > 30) ins.push({ type: "warning", title: `"${top.name}" Dominates Your Budget`, body: `${pct}% of yearly spending goes to "${top.name}". Consider if this aligns with your financial priorities.` });
    }
    if (avgPerMonth > 0) ins.push({ type: "info", title: "Monthly Budget Benchmark", body: `Your average monthly spend is ৳${avgPerMonth.toLocaleString()}. A 10% reduction target of ৳${Math.round(avgPerMonth * 0.9).toLocaleString()} could save ৳${Math.round(avgPerMonth * 0.1 * 12).toLocaleString()} per year.` });
    if (weeklyData.length > 0) {
      const top = [...weeklyData].sort((a, b) => b.total - a.total)[0];
      ins.push({ type: "tip", title: `Highest Spending: ${top.label}`, body: `You tend to spend most during ${top.label} (৳${top.total.toLocaleString()}). Planning purchases earlier in the month could improve budget control.` });
    }
    if (monthlyTotals.length >= 3) {
      const r = monthlyTotals.slice(-3).map((m) => m.total);
      if (r[0] < r[1] && r[1] < r[2]) ins.push({ type: "warning", title: "3-Month Rising Trend", body: "Your spending has increased for 3 consecutive months. This pattern can erode savings quickly if unchecked." });
      else if (r[0] > r[1] && r[1] > r[2]) ins.push({ type: "success", title: "3-Month Declining Trend", body: "Congratulations! Spending has decreased for 3 consecutive months. You're building strong financial discipline." });
    }
    if (ins.length === 0) ins.push({ type: "info", title: "Add More Data for Insights", body: "Track at least 2–3 months of spending to unlock personalized financial insights and recommendations." });
    return ins;
  }, [monthlyTotals, categoryData, totalThisYear, avgPerMonth, weeklyData]);

  const tabs: { id: View; label: string; icon: React.ElementType }[] = [
    { id: "overview",   label: "Overview",   icon: Activity  },
    { id: "monthly",    label: "Monthly",    icon: BarChart3 },
    { id: "categories", label: "Categories", icon: PieChart  },
    { id: "insights",   label: "Insights",   icon: Sparkles  },
  ];

  if (!hasMounted) return null;

  return (
    <div className="min-h-screen pt-[63px] font-sans" style={{ background: t.bg, color: t.text }}>

      {/* ── Sticky Header ────────────────────────────────────────────────────── */}
      <div className="sticky top-[63px] z-40 border-b" style={{ background: t.bg, borderColor: t.border }}>

        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          {/* Left */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
              style={{ color: t.text }}
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="w-px h-5 flex-shrink-0" style={{ background: t.border }} />
            <h1 className="text-base sm:text-xl font-black tracking-tight truncate" style={{ color: t.text }}>
              Financial Analytics
            </h1>
          </div>

          {/* Year picker */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              style={{ background: t.card, border: `1px solid ${t.border}`, color: t.text }}
            >
              <Calendar size={13} style={{ color: "#6366f1" }} />
              {selectedYear != null && !isNaN(selectedYear) ? selectedYear : "—"}
              <ChevronDown size={13} style={{ color: t.muted }} className={`transition-transform ${yearDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {yearDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[90px]"
                style={{ background: t.card, border: `1px solid ${t.border}` }}
              >
                {availableYears.map((y) => (
                  <button key={y} onClick={() => { setSelectedYear(y); setYearDropdownOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-bold transition-colors hover:opacity-80"
                    style={{ color: y === selectedYear ? "#6366f1" : t.text }}>
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs — scrollable on mobile */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex overflow-x-auto scrollbar-none gap-0">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all relative flex-shrink-0"
                style={{ color: active ? "#6366f1" : t.muted }}
              >
                <Icon size={14} />
                {label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#6366f1" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Page Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* ══════ OVERVIEW ══════════════════════════════════════════════════════ */}
        {view === "overview" && (
          <div className="space-y-4 sm:space-y-8">

            {/* Stat cards — 2 cols on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total This Year"  value={`৳ ${totalThisYear.toLocaleString()}`} icon={Wallet}   accent="#6366f1" theme={theme} trend="neutral" sub={`Across ${monthlyTotals.length} months`} />
              <StatCard label="Monthly Average"  value={`৳ ${avgPerMonth.toLocaleString()}`}   icon={BarChart3} accent="#10b981" theme={theme} trend={momTrend} sub="Based on tracked months" />
              <StatCard label="Highest Month"    value={maxMonth.total > 0 ? maxMonth.name : "—"} icon={Flame} accent="#f43f5e" theme={theme} sub={maxMonth.total > 0 ? `৳ ${maxMonth.total.toLocaleString()}` : undefined} />
              <StatCard label="Lowest Month"     value={minMonth ? minMonth.name : "—"} icon={Target} accent="#f59e0b" theme={theme} sub={minMonth ? `৳ ${minMonth.total.toLocaleString()}` : undefined} />
            </div>

            {/* All-time area trend */}
            <div className="rounded-2xl p-4 sm:p-6" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <SectionHeader title="All-Time Spending Trend" sub="Total monthly spend across all tracked periods" theme={theme} />
              {allMonthlyTotals.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={allMonthlyTotals}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis dataKey="name" tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: "transparent" }} />
                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" dot={{ fill: "#6366f1", r: 2 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyState theme={theme} />}
            </div>

            {/* Weekly + Daily — stacked on mobile, side-by-side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="rounded-2xl p-4 sm:p-6" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <SectionHeader title="Weekly Breakdown" sub="How spending distributes across weeks" theme={theme} />
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={weeklyData} barSize={10}>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                      <XAxis dataKey="label" tick={{ fill: t.muted, fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: t.muted, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} width={34} />
                      <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: "transparent" }} />
                      <Bar dataKey="total" radius={[5, 5, 0, 0]}>
                        {weeklyData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.85} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState theme={theme} />}
              </div>

              <div className="rounded-2xl p-4 sm:p-6" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <SectionHeader title="Avg Spend by Day of Month" sub="Which days you typically spend more" theme={theme} />
                {dailyPattern.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dailyPattern} barSize={6}>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                      <XAxis dataKey="day" tick={{ fill: t.muted, fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
                      <YAxis tick={{ fill: t.muted, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} width={34} />
                      <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: "transparent" }} />
                      <Bar dataKey="avg" fill="#10b981" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState theme={theme} />}
              </div>
            </div>
          </div>
        )}

        {/* ══════ MONTHLY ═══════════════════════════════════════════════════════ */}
        {view === "monthly" && (
          <div className="space-y-4 sm:space-y-8">

            <div className="rounded-2xl p-4 sm:p-6" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <SectionHeader title={`Monthly Spending — ${selectedYear}`} sub="Total expenditure for each month" theme={theme} />
              {monthlyTotals.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyTotals} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis dataKey="name" tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="total" name="Spending" radius={[7, 7, 0, 0]}>
                      {monthlyTotals.map((m, i) => <Cell key={i} fill={m.total === maxMonth.total ? "#f43f5e" : "#6366f1"} fillOpacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState theme={theme} />}
            </div>

            <div className="rounded-2xl p-4 sm:p-6" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <SectionHeader title="Month-over-Month Trend" sub="Spending each month vs. your average" theme={theme} />
              {monthlyTotals.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyTotals}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis dataKey="name" tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: "transparent" }} />
                    <Line type="monotone" dataKey="total" name="Spending" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} activeDot={{ r: 6 }} />
                    {avgPerMonth > 0 && <Line type="monotone" dataKey={() => avgPerMonth} name="Average" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />}
                    <Legend wrapperStyle={{ fontSize: 11, color: t.muted }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyState theme={theme} />}
            </div>

            {/* Summary table — card-based on mobile, real table on desktop */}
            <div className="rounded-2xl overflow-hidden" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="p-4 sm:p-6 border-b" style={{ borderColor: t.border }}>
                <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: t.muted }}>Month Summary</h2>
              </div>

              {monthlyTotals.length > 0 ? (
                <>
                  {/* Mobile: card list */}
                  <div className="sm:hidden divide-y" style={{ borderColor: t.border }}>
                    {monthlyTotals.map((m, i) => {
                      const diff  = m.total - avgPerMonth;
                      const share = totalThisYear > 0 ? Math.round((m.total / totalThisYear) * 100) : 0;
                      return (
                        <div key={i} className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-sm" style={{ color: t.text }}>{m.fullName}</div>
                              <div className="text-xs mt-0.5" style={{ color: t.muted }}>{m.count} entries</div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-sm" style={{ color: t.text }}>৳ {m.total.toLocaleString()}</div>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: diff > 0 ? "#f43f5e22" : "#10b98122", color: diff > 0 ? "#f43f5e" : "#10b981" }}>
                                {diff > 0 ? "+" : ""}৳ {diff.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: t.border }}>
                              <div className="h-full rounded-full" style={{ width: `${share}%`, background: "#6366f1" }} />
                            </div>
                            <span className="text-xs w-7 text-right" style={{ color: t.muted }}>{share}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop: proper table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                          {["Month", "Entries", "Total", "vs. Average", "Share"].map((h) => (
                            <th key={h} className="text-left px-6 py-3 font-black text-xs uppercase tracking-widest" style={{ color: t.muted }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyTotals.map((m, i) => {
                          const diff  = m.total - avgPerMonth;
                          const share = totalThisYear > 0 ? Math.round((m.total / totalThisYear) * 100) : 0;
                          return (
                            <tr key={i} className="border-b transition-colors" style={{ borderColor: t.border, color: t.text }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = t.hover)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                              <td className="px-6 py-4 font-bold">{m.fullName}</td>
                              <td className="px-6 py-4" style={{ color: t.muted }}>{m.count}</td>
                              <td className="px-6 py-4 font-bold">৳ {m.total.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-bold px-2 py-1 rounded-full"
                                  style={{ background: diff > 0 ? "#f43f5e22" : "#10b98122", color: diff > 0 ? "#f43f5e" : "#10b981" }}>
                                  {diff > 0 ? "+" : ""}৳ {diff.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: t.border }}>
                                    <div className="h-full rounded-full" style={{ width: `${share}%`, background: "#6366f1" }} />
                                  </div>
                                  <span className="text-xs w-8 text-right" style={{ color: t.muted }}>{share}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : <div className="p-6"><EmptyState theme={theme} /></div>}
            </div>
          </div>
        )}

        {/* ══════ CATEGORIES ════════════════════════════════════════════════════ */}
        {view === "categories" && (
          <div className="space-y-4 sm:space-y-8">

            {/* Donut + Ranking — stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">

              <div className="rounded-2xl p-4 sm:p-6" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <SectionHeader title="Spending Distribution" sub={`Top categories by total spend in ${selectedYear}`} theme={theme} />
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <RechartsPieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" nameKey="name">
                        {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(val) => [`৳ ${(val as number ?? 0).toLocaleString()}`, "Spent"]} />
                      <Legend wrapperStyle={{ fontSize: 11, color: t.muted }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : <EmptyState theme={theme} />}
              </div>

              <div className="rounded-2xl p-4 sm:p-6" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <SectionHeader title="Category Ranking" sub="Your top 10 spending categories" theme={theme} />
                <div className="space-y-2 sm:space-y-3">
                  {categoryData.map((c, i) => {
                    const pct = categoryData[0].value > 0 ? Math.round((c.value / categoryData[0].value) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold truncate max-w-[60%]" style={{ color: t.text }}>{c.name}</span>
                          <span className="text-xs font-bold" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>৳ {c.value.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.border }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                  {categoryData.length === 0 && <EmptyState theme={theme} />}
                </div>
              </div>
            </div>

            {/* Radar */}
            {radarData.length >= 3 && (
              <div className="rounded-2xl p-4 sm:p-6" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <SectionHeader title="Spending Radar (Last 6 Months)" sub="Actual vs. monthly average" theme={theme} />
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={85}>
                    <PolarGrid stroke={t.border} />
                    <PolarAngleAxis dataKey="month" tick={{ fill: t.muted, fontSize: 10 }} />
                    <Radar name="Spending" dataKey="spending" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                    <Radar name="Avg" dataKey="avg" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeDasharray="4 4" />
                    <Legend wrapperStyle={{ fontSize: 11, color: t.muted }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ══════ INSIGHTS ══════════════════════════════════════════════════════ */}
        {view === "insights" && (
          <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">

            <div className="text-center mb-6 sm:mb-10">
              <div
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-3 sm:mb-4"
                style={{ background: "#6366f115", color: "#6366f1" }}
              >
                <Sparkles size={12} /> AI-Powered Analysis
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: t.text }}>
                Your Financial Insights
              </h2>
              <p className="text-xs sm:text-sm mt-2" style={{ color: t.muted }}>
                Personalized observations based on your spending data
              </p>
            </div>

            {insights.map((ins, i) => (
              <InsightCard key={i} type={ins.type} title={ins.title} body={ins.body} theme={theme} />
            ))}

            {/* Summary pills */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
              {[
                { value: months.length,                                              label: "Months Tracked",                      color: "#6366f1" },
                { value: months.reduce((s, m) => s + m.spendings.length, 0),        label: "Total Spending Entries",              color: "#10b981" },
                { value: categoryData.length,                                        label: `Unique Categories (${selectedYear})`, color: "#f59e0b" },
                { value: availableYears.length,                                      label: "Years of Data",                       color: "#f43f5e" },
              ].map((item, i) => (
                <div key={i} className="rounded-2xl p-4 sm:p-5 text-center"
                  style={{ background: t.card, border: `1px solid ${t.border}` }}>
                  <div className="text-2xl sm:text-3xl font-black" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-xs uppercase tracking-widest mt-1 leading-tight" style={{ color: t.muted }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}