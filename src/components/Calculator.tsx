"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { findUserByEmail } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { IMonth, IIncome } from "@/store/features/auth/authSlice";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

// ── Theme tokens ──────────────────────────────────────────────────────────────

function tk(isLight: boolean) {
  return {
    bg:      isLight ? "#f5f5f7" : "#000000",
    card:    isLight ? "#ffffff" : "#0d0d0d",
    border:  isLight ? "#e8e8e8" : "#1e1e1e",
    text:    isLight ? "#000000" : "#ffffff",
    muted:   isLight ? "#999999" : "#555555",
    hover:   isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
    input:   isLight ? "#f9f9f9" : "#111111",
    accent:  "#6366f1",
    success: "#10b981",
    warning: "#f59e0b",
    danger:  "#ef4444",
  };
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return "৳" + Math.round(n).toLocaleString();
}

function fmtDec(n: number, d = 2): string {
  return (
    "৳" +
    n.toLocaleString(undefined, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    })
  );
}

// ── Data helpers ──────────────────────────────────────────────────────────────

function computeAverageMonthlyExpense(months: IMonth[]): number {
  const now = new Date();
  const completed = months.filter((m) => {
    const d = new Date(m.name + " 1");
    return !(
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });
  if (completed.length === 0) return 0;
  const total = completed.reduce(
    (sum, m) => sum + m.spendings.reduce((s, sp) => s + sp.cost, 0),
    0
  );
  return Math.round(total / completed.length);
}

function computeAverageMonthlyIncome(income: IIncome[]): number {
  if (income.length === 0) return 0;
  return Math.round(
    income.reduce((s, i) => s + i.amount, 0) / income.length
  );
}

// ── Projection ────────────────────────────────────────────────────────────────

interface ProjectionRow {
  year: number;
  monthlyCost: number;
  annualCost: number;
  cumulativeCost: number;
  inflationImpact: number;
  percentIncrease: number;
}

function buildProjection(
  base: number,
  rate: number,
  years: number
): ProjectionRow[] {
  if (base <= 0) return [];
  const baseAnnual = base * 12;
  const currentYear = new Date().getFullYear();
  const rows: ProjectionRow[] = [];
  let cumulative = 0;

  for (let i = 0; i <= years; i++) {
    const monthly = base * Math.pow(1 + rate / 100, i);
    const annual = monthly * 12;
    cumulative += annual;
    rows.push({
      year: currentYear + i,
      monthlyCost: monthly,
      annualCost: annual,
      cumulativeCost: cumulative,
      inflationImpact: annual - baseAnnual,
      percentIncrease: ((monthly - base) / base) * 100,
    });
  }
  return rows;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Calculator() {
  const router = useRouter();
  const { user: authUser, hydrated, setAuth } = useAuth();
  const { theme } = useTheme();

  const [hasMounted, setHasMounted] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [allMonths, setAllMonths] = useState<IMonth[]>([]);
  const [allIncome, setAllIncome] = useState<IIncome[]>([]);

  const [expenseMode, setExpenseMode] = useState<"auto" | "manual">("auto");
  const [manualExpense, setManualExpense] = useState<string>("");
  const [inflationRate, setInflationRate] = useState<string>("3.5");
  const [years, setYears] = useState<string>("10");
  const [incomeGrowthRate, setIncomeGrowthRate] = useState<string>("0");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !hydrated) return;
    if (!authUser) {
      router.push("/login");
    }
  }, [authUser, hasMounted, hydrated, router]);

  useEffect(() => {
    if (!hasMounted) return;
    const fetchData = async () => {
      setIsFetching(true);
      try {
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
      } catch {
        setAllMonths(authUser?.money?.Months || []);
        setAllIncome(authUser?.income || []);
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMounted]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const t = tk(theme);
  const autoAverage = computeAverageMonthlyExpense(allMonths);
  const baseMonthlyCost =
    expenseMode === "auto" ? autoAverage : parseFloat(manualExpense) || 0;
  const parsedRate = parseFloat(inflationRate) || 0;
  const parsedYears = Math.min(50, Math.max(1, parseInt(years) || 10));
  const parsedIncomeGrowth = parseFloat(incomeGrowthRate) || 0;

  const rows = buildProjection(baseMonthlyCost, parsedRate, parsedYears);
  const totalInflationImpact = rows.reduce((s, r) => s + r.inflationImpact, 0);
  const doublingYears = parsedRate > 0 ? Math.round(72 / parsedRate) : null;
  const doublingYear = doublingYears
    ? new Date().getFullYear() + doublingYears
    : null;
  const growthMultiple =
    rows.length > 1
      ? rows[rows.length - 1].monthlyCost / baseMonthlyCost
      : 1;
  const hasIncome = allIncome.length > 0;
  const avgMonthlyIncome = hasIncome
    ? computeAverageMonthlyIncome(allIncome)
    : 0;

  const completedMonthCount = allMonths.filter((m) => {
    const now = new Date();
    const d = new Date(m.name + " 1");
    return !(
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!hasMounted) return null;

  return (
    <div
      style={{ background: t.bg, color: t.text, minHeight: "100vh" }}
      className="pt-[63px]"
    >
      {/* Loading overlay */}
      {isFetching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: t.accent, borderTopColor: "transparent" }} />
        </div>
      )}

      {/* Sticky page header */}
      <div
        className="sticky top-[63px] z-40 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: t.bg, borderColor: t.border }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl transition-colors"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
        >
          <ArrowLeft size={16} style={{ color: t.muted }} />
        </button>
        <div>
          <h1 className="text-base font-semibold" style={{ color: t.text }}>
            Inflation Calculator
          </h1>
          <p className="text-xs" style={{ color: t.muted }}>
            Project your expenses over time
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-5">

        {/* ── 1. Input Panel ── */}
        <div
          className="rounded-2xl p-4 sm:p-6 space-y-5"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
        >
          <h2 className="text-sm font-semibold" style={{ color: t.text }}>
            Configure Projection
          </h2>

          {/* Expense source toggle */}
          <div className="space-y-3">
            <p className="text-xs font-medium" style={{ color: t.muted }}>
              Monthly Expense Source
            </p>
            <div className="flex gap-2">
              {(["auto", "manual"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setExpenseMode(mode)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={
                    expenseMode === mode
                      ? {
                          background: t.accent,
                          color: "#ffffff",
                          border: `1px solid ${t.accent}`,
                        }
                      : {
                          background: t.input,
                          color: t.muted,
                          border: `1px solid ${t.border}`,
                        }
                  }
                >
                  {mode === "auto" ? "Auto (from Stats)" : "Manual"}
                </button>
              ))}
            </div>

            {expenseMode === "auto" ? (
              autoAverage > 0 ? (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: t.input, border: `1px solid ${t.border}` }}
                >
                  <span
                    className="text-xl font-bold"
                    style={{ color: t.accent }}
                  >
                    {fmtDec(autoAverage)}
                  </span>
                  <span className="text-xs" style={{ color: t.muted }}>
                    avg/month · based on {completedMonthCount} completed month
                    {completedMonthCount !== 1 ? "s" : ""}
                  </span>
                </div>
              ) : (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: `${t.warning}15`,
                    border: `1px solid ${t.warning}40`,
                    color: t.warning,
                  }}
                >
                  No expense data yet. Add spending on the Dashboard or switch
                  to Manual.
                </div>
              )
            ) : (
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color: t.muted }}
                >
                  ৳
                </span>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 2500"
                  value={manualExpense}
                  onChange={(e) => setManualExpense(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: t.input,
                    border: `1px solid ${t.border}`,
                    color: t.text,
                  }}
                />
              </div>
            )}
          </div>

          {/* Parameter grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: t.muted }}
              >
                Yearly Inflation (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={inflationRate}
                onChange={(e) => setInflationRate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: t.input,
                  border: `1px solid ${t.border}`,
                  color: t.text,
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: t.muted }}
              >
                Number of Years (1–50)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: t.input,
                  border: `1px solid ${t.border}`,
                  color: t.text,
                }}
              />
            </div>
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label
                className="text-xs font-medium"
                style={{ color: t.muted }}
              >
                Income Growth Rate (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={incomeGrowthRate}
                onChange={(e) => setIncomeGrowthRate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: t.input,
                  border: `1px solid ${t.border}`,
                  color: t.text,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── 2. Summary Cards ── */}
        {rows.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Current Monthly",
                value: fmtDec(baseMonthlyCost),
                color: t.accent,
              },
              {
                label: "Final Year Monthly",
                value: fmtDec(rows[rows.length - 1].monthlyCost),
                color: t.danger,
              },
              {
                label: "Total Over Period",
                value: fmt(rows[rows.length - 1].cumulativeCost),
                color: t.text,
              },
              {
                label: "Total Inflation Impact",
                value: fmt(totalInflationImpact),
                color: t.warning,
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl p-4 space-y-1"
                style={{ background: t.card, border: `1px solid ${t.border}` }}
              >
                <p className="text-xs" style={{ color: t.muted }}>
                  {card.label}
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: card.color }}
                >
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── 3. Projection Table ── */}
        {rows.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}` }}
          >
            <div
              className="px-4 sm:px-6 py-4 border-b"
              style={{ borderColor: t.border }}
            >
              <h2 className="text-sm font-semibold" style={{ color: t.text }}>
                Year-by-Year Projection
              </h2>
            </div>

            {/* Mobile: card list */}
            <div className="sm:hidden divide-y" style={{ borderColor: t.border }}>
              {rows.map((row, i) => (
                <div
                  key={row.year}
                  className="px-4 py-4 space-y-2"
                  style={{
                    background: i === 0 ? `${t.accent}12` : "transparent",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm" style={{ color: t.text }}>
                      {row.year}
                    </span>
                    {i === 0 && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${t.accent}20`, color: t.accent }}
                      >
                        Base
                      </span>
                    )}
                    <span className="text-xs" style={{ color: t.muted }}>
                      +{row.percentIncrease.toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div style={{ color: t.muted }}>Monthly</div>
                    <div className="font-medium text-right" style={{ color: t.text }}>
                      {fmtDec(row.monthlyCost)}
                    </div>
                    <div style={{ color: t.muted }}>Annual</div>
                    <div className="font-medium text-right" style={{ color: t.text }}>
                      {fmt(row.annualCost)}
                    </div>
                    <div style={{ color: t.muted }}>Cumulative</div>
                    <div className="font-medium text-right" style={{ color: t.text }}>
                      {fmt(row.cumulativeCost)}
                    </div>
                    <div style={{ color: t.muted }}>Inflation Impact</div>
                    <div
                      className="font-medium text-right"
                      style={{
                        color: row.inflationImpact > 0 ? t.danger : t.success,
                      }}
                    >
                      {row.inflationImpact > 0 ? "+" : ""}
                      {fmt(row.inflationImpact)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-xs"
                    style={{
                      background: t.hover,
                      borderBottom: `1px solid ${t.border}`,
                    }}
                  >
                    {[
                      "Year",
                      "Monthly Cost",
                      "Annual Cost",
                      "Cumulative Cost",
                      "Inflation Impact",
                      "% Increase",
                      ...(hasIncome ? ["Exp/Income Ratio"] : []),
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 font-medium whitespace-nowrap"
                        style={{ color: t.muted }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const projectedIncome =
                      avgMonthlyIncome *
                      Math.pow(1 + parsedIncomeGrowth / 100, i);
                    const expRatio =
                      hasIncome && projectedIncome > 0
                        ? ((row.monthlyCost / projectedIncome) * 100).toFixed(
                            1
                          )
                        : null;

                    return (
                      <tr
                        key={row.year}
                        style={{
                          background:
                            i === 0
                              ? `${t.accent}12`
                              : i % 2 === 0
                              ? t.hover
                              : "transparent",
                          borderBottom: `1px solid ${t.border}`,
                        }}
                      >
                        <td className="px-5 py-3 font-medium" style={{ color: t.text }}>
                          <div className="flex items-center gap-2">
                            {row.year}
                            {i === 0 && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  background: `${t.accent}20`,
                                  color: t.accent,
                                }}
                              >
                                Base
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-medium" style={{ color: t.text }}>
                          {fmtDec(row.monthlyCost)}
                        </td>
                        <td className="px-5 py-3" style={{ color: t.text }}>
                          {fmt(row.annualCost)}
                        </td>
                        <td className="px-5 py-3" style={{ color: t.text }}>
                          {fmt(row.cumulativeCost)}
                        </td>
                        <td
                          className="px-5 py-3 font-medium"
                          style={{
                            color:
                              row.inflationImpact > 0 ? t.danger : t.success,
                          }}
                        >
                          {row.inflationImpact > 0 ? "+" : ""}
                          {fmt(row.inflationImpact)}
                        </td>
                        <td
                          className="px-5 py-3"
                          style={{
                            color:
                              row.percentIncrease > 0 ? t.warning : t.muted,
                          }}
                        >
                          {i === 0 ? "—" : `+${row.percentIncrease.toFixed(1)}%`}
                        </td>
                        {hasIncome && (
                          <td
                            className="px-5 py-3"
                            style={{
                              color:
                                expRatio && parseFloat(expRatio) > 50
                                  ? t.danger
                                  : expRatio && parseFloat(expRatio) > 30
                                  ? t.warning
                                  : t.success,
                            }}
                          >
                            {expRatio ? `${expRatio}%` : "—"}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 4. Financial Insights ── */}
        {rows.length > 0 && (
          <div
            className="rounded-2xl p-4 sm:p-6 space-y-3"
            style={{ background: t.card, border: `1px solid ${t.border}` }}
          >
            <h2 className="text-sm font-semibold" style={{ color: t.text }}>
              Financial Insights
            </h2>

            <div className="space-y-2">
              {/* Doubling year */}
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: `${t.accent}10`, border: `1px solid ${t.accent}30` }}
              >
                <TrendingUp size={16} style={{ color: t.accent, flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm" style={{ color: t.text }}>
                  {doublingYear
                    ? <>Your monthly cost <strong>doubles by {doublingYear}</strong> ({doublingYears} years at {parsedRate}% inflation — Rule of 72)</>
                    : "Cost never doubles at 0% inflation"}
                </p>
              </div>

              {/* Total inflation impact */}
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: `${t.danger}10`, border: `1px solid ${t.danger}30` }}
              >
                <DollarSign size={16} style={{ color: t.danger, flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm" style={{ color: t.text }}>
                  You will pay an extra <strong style={{ color: t.danger }}>{fmt(totalInflationImpact)}</strong> over {parsedYears} years due to inflation
                </p>
              </div>

              {/* Growth multiple */}
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: `${t.warning}10`, border: `1px solid ${t.warning}30` }}
              >
                <BarChart3 size={16} style={{ color: t.warning, flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm" style={{ color: t.text }}>
                  Expenses grow <strong style={{ color: t.warning }}>{growthMultiple.toFixed(2)}×</strong> over {parsedYears} years — from {fmtDec(baseMonthlyCost)}/mo to {fmtDec(rows[rows.length - 1].monthlyCost)}/mo
                </p>
              </div>

              {/* Income growth warning */}
              {parsedIncomeGrowth > 0 && parsedIncomeGrowth < parsedRate && (
                <div
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: `${t.danger}10`, border: `1px solid ${t.danger}40` }}
                >
                  <AlertTriangle size={16} style={{ color: t.danger, flexShrink: 0, marginTop: 1 }} />
                  <p className="text-sm" style={{ color: t.danger }}>
                    <strong>Warning:</strong> Your income growth ({incomeGrowthRate}%) is below inflation ({inflationRate}%) — purchasing power decreases over time
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 5. Empty state ── */}
        {!isFetching &&
          rows.length === 0 &&
          expenseMode === "auto" &&
          !isFetching && (
            <div
              className="rounded-2xl p-8 text-center space-y-2"
              style={{ background: t.card, border: `1px solid ${t.border}` }}
            >
              <p className="text-base font-medium" style={{ color: t.text }}>
                No expense data found
              </p>
              <p className="text-sm" style={{ color: t.muted }}>
                Add spending entries on the Dashboard or switch to Manual mode
                to enter your monthly expenses directly.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => router.push("/dashBoard")}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: t.accent, color: "#ffffff" }}
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => setExpenseMode("manual")}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: t.input,
                    color: t.text,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  Use Manual
                </button>
              </div>
            </div>
          )}

      </div>
    </div>
  );
}
