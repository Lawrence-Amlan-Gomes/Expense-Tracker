"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { updateMoney } from "@/app/actions";
import EmailNotVerified from "./EmailNotVerified";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IBank,
  IMonth,
  ISpending,
  IMoney,
  IIncome,
} from "@/store/features/auth/authSlice";
import {
  X,
  Plus,
  Save,
  Send,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  BarChart2,
  CheckCircle2,
  Circle,
  Pencil,
  Wallet,
  Calendar,
  Receipt,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseItem(item: string): {
  Name: string;
  [key: string]: number | string;
} {
  try {
    const parsed = JSON.parse(item);
    if (typeof parsed === "object" && parsed !== null && "Name" in parsed)
      return parsed;
    throw new Error("Invalid format");
  } catch {
    return { Name: item };
  }
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

function tk(theme: boolean) {
  return {
    bg: theme ? "#f7f7f8" : "#080808",
    surface: theme ? "#ffffff" : "#0f0f0f",
    surfaceAlt: theme ? "#f0f0f2" : "#141414",
    border: theme ? "#e4e4e7" : "#1c1c1c",
    borderStrong: theme ? "#d0d0d5" : "#2a2a2a",
    text: theme ? "#0a0a0b" : "#f0f0f0",
    textSub: theme ? "#5c5c6e" : "#666680",
    textMuted: theme ? "#9898a8" : "#404055",
    accent: "#6366f1",
    accentHover: "#4f46e5",
    accentSoft: theme ? "#eef2ff" : "#1a1a2e",
    danger: "#ef4444",
    success: "#10b981",
    warning: "#f59e0b",
    inputBg: theme ? "#f7f7f8" : "#0f0f0f",
    shadow: theme
      ? "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)"
      : "0 1px 3px rgba(0,0,0,0.4)",
    shadowMd: theme
      ? "0 4px 16px rgba(0,0,0,0.08)"
      : "0 4px 16px rgba(0,0,0,0.5)",
  };
}

// ─── Mobile Tab Type ──────────────────────────────────────────────────────────
type MobileTab = "accounts" | "timeline" | "spendings";

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashBoard() {
  const { theme } = useTheme();
  const t = tk(theme);
  const [hasMounted, setHasMounted] = useState(false);
  const { user: auth, setAuth } = useAuth();
  const router = useRouter();

  const [banks, setBanks] = useState<IBank[]>([]);
  const [inCash, setInCash] = useState<number>(0);
  const [months, setMonths] = useState<IMonth[]>([]);
  const [income, setIncome] = useState<IIncome[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [monthSearch, setMonthSearch] = useState("");
  const [originalMoney, setOriginalMoney] = useState<IMoney | null>(null);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [subItemSearchModalOpen, setSubItemSearchModalOpen] = useState(false);
  const [selectedSpendingDates, setSelectedSpendingDates] = useState<
    Set<string>
  >(new Set());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [subItemSearchQuery, setSubItemSearchQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("accounts");

  const [bankModal, setBankModal] = useState<{
    show: boolean;
    bank: IBank | null;
  }>({ show: false, bank: null });
  const [cashModal, setCashModal] = useState(false);
  const [addMonthModalOpen, setAddMonthModalOpen] = useState(false);
  const [totalBalanceModalOpen, setTotalBalanceModalOpen] = useState(false);
  const [spendingModal, setSpendingModal] = useState<{
    show: boolean;
    spending: ISpending | null;
    monthName: string;
  }>({ show: false, spending: null, monthName: "" });

  const selectedMonthData = months.find((m) => m.name === selectedMonth);
  const totalSpending =
    selectedMonthData?.spendings
      .filter((s) => selectedSpendingDates.has(`${s.date}-${s.item}`))
      .reduce((sum, s) => sum + s.cost, 0) || 0;

  useEffect(() => {
    if (selectedMonthData) {
      setSelectedSpendingDates(
        new Set(selectedMonthData.spendings.map((s) => `${s.date}-${s.item}`)),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedMonthData?.spendings.length]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Runs ONCE when auth first loads — never again
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (auth === null && hasMounted) {
      router.push("/login");
    } else if (auth?.money && !initialized) {
      setBanks(auth.money.banks || []);
      setInCash(auth.money.inCash || 0);
      setMonths(auth.money.Months || []);
      setOriginalMoney(auth.money);
      setSelectedBanks(auth.money.banks?.map((b) => b.name) || []);
      setIncome(auth.income || []);
      setInitialized(true);
    }
  }, [auth, hasMounted, router, initialized]);

  useEffect(() => {
    if (months.length > 0 && selectedMonth === null) {
      const now = new Date();
      const currentMonthName = now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      const currentMonthExists = months.find(
        (m) => m.name === currentMonthName,
      );
      if (currentMonthExists) {
        setSelectedMonth(currentMonthName);
      } else {
        const sortedMonths = [...months].sort(
          (a, b) =>
            new Date(b.name + " 1").getTime() -
            new Date(a.name + " 1").getTime(),
        );
        if (sortedMonths.length > 0) setSelectedMonth(sortedMonths[0].name);
      }
    }
  }, [months, selectedMonth]);

const handleIncomeUpdate = (amount: number) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString("default", { month: "long" });
    setIncome((prev) => {
      const existing = prev.find((i) => i.year === year && i.month === month);
      if (existing) {
        return prev.map((i) =>
          i.year === year && i.month === month
            ? { ...i, amount: i.amount + amount }
            : i
        );
      }
      return [...prev, { year, month, amount }];
    });
  };

const handleSave = async () => {
    if (!auth?.email) return;
    setIsSaving(true);
    try {
      const updatedMoney: IMoney = { banks, inCash, Months: months };
      await updateMoney(auth.email, updatedMoney, income);
      setAuth({ ...auth, money: updatedMoney, income });
      setOriginalMoney(updatedMoney);
      alert("✅ Changes saved successfully!");
    } catch (error) {
      alert("❌ Failed to save changes");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBankDeposit = (bankName: string, amount: number) => {
    setBanks(banks.map((b) =>
      b.name === bankName ? { ...b, amount: b.amount + amount } : b
    ));
    handleIncomeUpdate(amount);
  };

  const handleBankWithdraw = (bankName: string, amount: number) => {
    const bank = banks.find((b) => b.name === bankName);
    if (!bank || bank.amount < amount) {
      alert("❌ Insufficient bank balance");
      return;
    }
    setBanks(
      banks.map((b) =>
        b.name === bankName ? { ...b, amount: b.amount - amount } : b,
      ),
    );
    setInCash(inCash + amount);
  };

  const handleBankTransfer = (
    fromBank: string,
    toBank: string,
    amount: number,
  ) => {
    const source = banks.find((b) => b.name === fromBank);
    if (!source || source.amount < amount) {
      alert("❌ Insufficient balance in source bank");
      return;
    }
    setBanks(
      banks.map((b) => {
        if (b.name === fromBank) return { ...b, amount: b.amount - amount };
        if (b.name === toBank) return { ...b, amount: b.amount + amount };
        return b;
      }),
    );
  };

  const handleCashDeposit = (bankName: string, amount: number) => {
    if (inCash < amount) {
      alert("❌ Insufficient cash");
      return;
    }
    setBanks(banks.map((b) =>
      b.name === bankName ? { ...b, amount: b.amount + amount } : b
    ));
    setInCash(inCash - amount);
  };

  const handleEarnCash = (amount: number) => {
    setInCash(inCash + amount);
    handleIncomeUpdate(amount);
  };

  const handleAddMonth = (monthName: string) => {
    if (months.some((m) => m.name === monthName)) {
      alert("❌ This month already exists");
      return;
    }
    setMonths([...months, { name: monthName, spendings: [] }]);
  };

  const handleAddSpending = (monthName: string, spending: ISpending) => {
    if (inCash < spending.cost) {
      alert("❌ Insufficient cash for this spending");
      return;
    }
    const month = months.find((m) => m.name === monthName);
    if (month && month.spendings.some((s) => s.date === spending.date)) {
      alert("❌ A spending already exists for this date in this month");
      return;
    }
    setMonths(
      months.map((m) =>
        m.name === monthName
          ? { ...m, spendings: [...m.spendings, spending] }
          : m,
      ),
    );
    setInCash(inCash - spending.cost);
  };

  const handleUpdateSpending = (
    monthName: string,
    oldSpending: ISpending,
    newSpending: ISpending,
  ) => {
    const month = months.find((m) => m.name === monthName);
    if (!month) return;
    if (
      oldSpending.date !== newSpending.date &&
      month.spendings.some((s) => s.date === newSpending.date)
    ) {
      alert("❌ A spending already exists for this date");
      return;
    }
    const costDiff = newSpending.cost - oldSpending.cost;
    if (inCash < costDiff) {
      alert("❌ Insufficient cash to increase spending");
      return;
    }
    setMonths(
      months.map((m) =>
        m.name === monthName
          ? {
              ...m,
              spendings: m.spendings.map((s) =>
                s.date === oldSpending.date && s.item === oldSpending.item
                  ? newSpending
                  : s,
              ),
            }
          : m,
      ),
    );
    setInCash(inCash - costDiff);
  };

  const handleDeleteSpending = (monthName: string, spending: ISpending) => {
    setMonths(
      months.map((m) =>
        m.name === monthName
          ? {
              ...m,
              spendings: m.spendings.filter(
                (s) => !(s.date === spending.date && s.item === spending.item),
              ),
            }
          : m,
      ),
    );
    setInCash(inCash + spending.cost);
  };

  const hasUnsavedChanges = () => {
    if (!originalMoney) return false;
    const moneyChanged =
      JSON.stringify({ banks, inCash, Months: months }) !==
      JSON.stringify(originalMoney);
    const incomeChanged =
      JSON.stringify(income) !== JSON.stringify(auth?.income || []);
    return moneyChanged || incomeChanged;
  };

  const handleRenameBank = (oldName: string, newName: string) => {
    if (!newName.trim()) {
      alert("❌ Bank name cannot be empty");
      return;
    }
    if (banks.some((b) => b.name === newName.trim() && b.name !== oldName)) {
      alert("❌ A bank with this name already exists");
      return;
    }
    setBanks(
      banks.map((b) =>
        b.name === oldName ? { ...b, name: newName.trim() } : b,
      ),
    );
  };

  if (!hasMounted) return null;

  const totalBalance = banks.reduce((sum, b) => sum + b.amount, 0) + inCash;
  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase()),
  );
  const filteredMonths = [...months]
    .filter((m) => m.name.toLowerCase().includes(monthSearch.toLowerCase()))
    .sort(
      (a, b) =>
        new Date(a.name + " 1").getTime() - new Date(b.name + " 1").getTime(),
    );

  // ─── Accounts Panel Content ────────────────────────────────────────────────
  const AccountsPanel = () => (
    <div className="flex flex-col h-full">
      {/* Total Balance chip */}
      <div className="px-4 pt-4 pb-3">
        <div
          onClick={() => setTotalBalanceModalOpen(true)}
          className="cursor-pointer rounded-xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
          }}
        >
          <div className="text-xs font-medium text-indigo-200 mb-1">
            Total Balance
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ৳ {totalBalance.toLocaleString()}
          </div>
          <div className="text-xs text-indigo-300 mt-1">
            {banks.length} accounts · tap to compare
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges()}
          className="w-full mt-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          style={
            isSaving || !hasUnsavedChanges()
              ? {
                  background: t.surfaceAlt,
                  color: t.textMuted,
                  cursor: "not-allowed",
                }
              : {
                  background: t.success,
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                }
          }
        >
          <Save size={14} />
          {isSaving
            ? "Saving…"
            : hasUnsavedChanges()
              ? "Save Changes"
              : "All Saved"}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: t.textMuted }}
          />
          <input
            type="text"
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
            placeholder="Search accounts…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none transition-all"
            style={{
              background: t.inputBg,
              border: `1px solid ${t.border}`,
              color: t.text,
            }}
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {/* Add Bank */}
        <button
          onClick={() => {
            const bankName = prompt("Enter new bank name:");
            if (bankName?.trim()) {
              if (banks.some((b) => b.name === bankName.trim())) {
                alert("❌ A bank with this name already exists");
                return;
              }
              setBanks([...banks, { name: bankName.trim(), amount: 0 }]);
            }
          }}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-dashed transition-all hover:border-indigo-400 hover:text-indigo-500 group"
          style={{ borderColor: t.borderStrong, color: t.textMuted }}
        >
          <Plus
            size={14}
            className="group-hover:text-indigo-500 transition-colors"
          />
          Add Bank Account
        </button>

        {/* Bank cards */}
        {filteredBanks.map((bank) => (
          <div
            key={bank.name}
            onClick={() => setBankModal({ show: true, bank })}
            className="rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group"
            style={{
              background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
              boxShadow: "0 2px 8px rgba(29,78,216,0.2)",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-blue-300 mb-0.5">Bank</div>
                <div className="text-sm font-semibold text-white truncate">
                  {bank.name}
                </div>
                <div className="text-lg font-bold text-white mt-1">
                  ৳ {bank.amount.toLocaleString()}
                </div>
              </div>
              <Pencil
                size={12}
                className="text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0"
              />
            </div>
          </div>
        ))}

        {banks.length > 0 && filteredBanks.length === 0 && (
          <p
            className="text-center text-sm py-6"
            style={{ color: t.textMuted }}
          >
            No banks match
          </p>
        )}

        {/* Cash card */}
        <div
          onClick={() => setCashModal(true)}
          className="rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group"
          style={{
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            boxShadow: "0 2px 8px rgba(5,150,105,0.2)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-emerald-300 mb-0.5">Available</div>
              <div className="text-sm font-semibold text-white">Cash</div>
              <div className="text-lg font-bold text-white mt-1">
                ৳ {inCash.toLocaleString()}
              </div>
            </div>
            <Pencil
              size={12}
              className="text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Timeline Panel Content ────────────────────────────────────────────────
  const TimelinePanel = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: t.textMuted }}
          />
          <input
            type="text"
            value={monthSearch}
            onChange={(e) => setMonthSearch(e.target.value)}
            placeholder="Search months…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{
              background: t.inputBg,
              border: `1px solid ${t.border}`,
              color: t.text,
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        <button
          onClick={() => setAddMonthModalOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-dashed transition-all hover:border-indigo-400 hover:text-indigo-500 group"
          style={{ borderColor: t.borderStrong, color: t.textMuted }}
        >
          <Plus size={14} />
          Add Month
        </button>

        {filteredMonths.map((month) => {
          const total = month.spendings.reduce((s, x) => s + x.cost, 0);
          const isSelected = selectedMonth === month.name;
          const isEarliest =
            new Date(month.name + " 1").getTime() ===
            Math.min(...months.map((m) => new Date(m.name + " 1").getTime()));
          const isLatest =
            new Date(month.name + " 1").getTime() ===
            Math.max(...months.map((m) => new Date(m.name + " 1").getTime()));
          const canDelete = (isEarliest || isLatest) && total === 0;

          return (
            <div
              key={month.name}
              onClick={() => {
                setSelectedMonth(month.name);
                setMobileTab("spendings"); // Auto-navigate to spendings on mobile
              }}
              className="relative group rounded-xl px-3 py-3 cursor-pointer transition-all"
              style={
                isSelected
                  ? {
                      background: t.accent,
                      boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                    }
                  : { background: "transparent" }
              }
              onMouseEnter={(e) => {
                if (!isSelected)
                  e.currentTarget.style.background = t.surfaceAlt;
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="flex items-center justify-between pr-6">
                <div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: isSelected ? "#fff" : t.text }}
                  >
                    {month.name}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{
                      color: isSelected ? "rgba(255,255,255,0.65)" : t.textSub,
                    }}
                  >
                    {month.spendings.length} entries
                    {total > 0 && ` · ৳${total.toLocaleString()}`}
                  </div>
                </div>
              </div>

              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete empty month "${month.name}"?`)) {
                      setMonths(months.filter((m) => m.name !== month.name));
                      if (selectedMonth === month.name) setSelectedMonth(null);
                    }
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                  style={{ background: t.danger, color: "#fff" }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        {months.length > 0 && filteredMonths.length === 0 && (
          <p
            className="text-center text-sm py-6"
            style={{ color: t.textMuted }}
          >
            No months match
          </p>
        )}
      </div>
    </div>
  );

  // ─── Spendings Panel Content ───────────────────────────────────────────────
  const SpendingsPanel = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-4 border-b flex items-center justify-between flex-shrink-0"
        style={{ background: t.surface, borderColor: t.border }}
      >
        <div className="min-w-0 flex-1">
          <h2
            className="text-base font-bold truncate"
            style={{ color: t.text }}
          >
            {selectedMonth || "Select a month"}
          </h2>
          {selectedMonthData && (
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>
              {selectedMonthData.spendings.length} entries
            </p>
          )}
        </div>

        {selectedMonthData && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <div
              onClick={() => {
                setSubItemSearchQuery("");
                setSubItemSearchModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
              }}
            >
              <div>
                <div className="text-xs text-red-300 leading-none">Total</div>
                <div className="text-sm font-bold text-white">
                  ৳ {totalSpending.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                setSpendingModal({
                  show: true,
                  spending: null,
                  monthName: selectedMonth!,
                })
              }
              className="flex items-center justify-center w-9 h-9 rounded-xl text-white transition-all active:scale-[0.98]"
              style={{
                background: t.accent,
                boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
              }}
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Spending list */}
      {selectedMonthData ? (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {selectedMonthData.spendings.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full gap-3"
              style={{ color: t.textMuted }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: t.surfaceAlt }}
              >
                <Plus size={28} style={{ color: t.textMuted }} />
              </div>
              <p className="text-sm font-medium">No spendings yet</p>
              <p className="text-xs">Tap &quot;+&quot; to add a spending</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...selectedMonthData.spendings]
                .sort((a, b) => parseInt(a.date) - parseInt(b.date))
                .map((spending) => {
                  const key = `${spending.date}-${spending.item}`;
                  const isChecked = selectedSpendingDates.has(key);
                  const parsed = parseItem(spending.item);
                  const subCount = Object.keys(parsed).filter(
                    (k) => k !== "Name",
                  ).length;

                  return (
                    <div
                      key={key}
                      className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-all border"
                      style={{
                        background: isChecked ? t.surface : t.surfaceAlt,
                        borderColor: isChecked ? t.border : "transparent",
                        opacity: isChecked ? 1 : 0.45,
                        boxShadow: isChecked ? t.shadow : "none",
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => {
                          const newSet = new Set(selectedSpendingDates);
                          if (newSet.has(key)) newSet.delete(key);
                          else newSet.add(key);
                          setSelectedSpendingDates(newSet);
                        }}
                        className="flex-shrink-0 transition-all"
                      >
                        {isChecked ? (
                          <CheckCircle2 size={18} style={{ color: t.accent }} />
                        ) : (
                          <Circle size={18} style={{ color: t.textMuted }} />
                        )}
                      </button>

                      {/* Date badge */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ background: t.accentSoft, color: t.accent }}
                      >
                        {spending.date}
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() =>
                          setSpendingModal({
                            show: true,
                            spending,
                            monthName: selectedMonth!,
                          })
                        }
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-sm font-semibold truncate"
                            style={{ color: t.text }}
                          >
                            {parsed.Name as string}
                          </span>
                          {subCount > 0 && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0"
                              style={{
                                background: t.surfaceAlt,
                                color: t.textSub,
                              }}
                            >
                              {subCount} items
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div
                        className="flex-shrink-0 text-right cursor-pointer"
                        onClick={() =>
                          setSpendingModal({
                            show: true,
                            spending,
                            monthName: selectedMonth!,
                          })
                        }
                      >
                        <div
                          className="text-sm font-bold"
                          style={{ color: t.danger }}
                        >
                          ৳ {spending.cost.toLocaleString()}
                        </div>
                      </div>

                      {/* Edit hint - hidden on mobile touch */}
                      <Pencil
                        size={13}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden sm:block"
                        style={{ color: t.textMuted }}
                        onClick={() =>
                          setSpendingModal({
                            show: true,
                            spending,
                            monthName: selectedMonth!,
                          })
                        }
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-4 px-4"
          style={{ color: t.textMuted }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: t.surface }}
          >
            <Calendar size={32} style={{ color: t.textMuted }} />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold" style={{ color: t.textSub }}>
              No month selected
            </p>
            <p className="text-sm mt-1">Pick a month from the Timeline tab</p>
            <button
              onClick={() => setMobileTab("timeline")}
              className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: t.accent }}
            >
              Go to Timeline
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return auth?.isEmailVerified ? (
    <>
      {/* ── DESKTOP LAYOUT (lg and above) ──────────────────────────────────── */}
      <div
        className="hidden lg:flex h-screen w-full overflow-hidden pt-[63px]"
        style={{
          background: t.bg,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {/* LEFT PANEL — Accounts */}
        <div
          className="w-[280px] flex-shrink-0 flex flex-col border-r"
          style={{ background: t.surface, borderColor: t.border }}
        >
          <div
            className="px-5 pt-5 pb-4 border-b"
            style={{ borderColor: t.border }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: t.textMuted }}
              >
                Accounts
              </span>
              <button
                onClick={() => router.push("/stats")}
                title="Analytics"
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all hover:scale-105"
                style={{ background: t.accentSoft, color: t.accent }}
              >
                <BarChart2 size={13} />
                Stats
              </button>
            </div>
            <div
              onClick={() => setTotalBalanceModalOpen(true)}
              className="cursor-pointer rounded-xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
              }}
            >
              <div className="text-xs font-medium text-indigo-200 mb-1">
                Total Balance
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                ৳ {totalBalance.toLocaleString()}
              </div>
              <div className="text-xs text-indigo-300 mt-1">
                {banks.length} accounts · tap to compare
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges()}
              className="w-full mt-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={
                isSaving || !hasUnsavedChanges()
                  ? {
                      background: t.surfaceAlt,
                      color: t.textMuted,
                      cursor: "not-allowed",
                    }
                  : {
                      background: t.success,
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                    }
              }
            >
              <Save size={14} />
              {isSaving
                ? "Saving…"
                : hasUnsavedChanges()
                  ? "Save Changes"
                  : "All Saved"}
            </button>
          </div>
          <div className="px-4 py-3 border-b" style={{ borderColor: t.border }}>
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: t.textMuted }}
              />
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Search accounts…"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none transition-all"
                style={{
                  background: t.inputBg,
                  border: `1px solid ${t.border}`,
                  color: t.text,
                }}
              />
            </div>
          </div>
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin"
            style={{ scrollbarColor: `${t.borderStrong} transparent` }}
          >
            <button
              onClick={() => {
                const bankName = prompt("Enter new bank name:");
                if (bankName?.trim()) {
                  if (banks.some((b) => b.name === bankName.trim())) {
                    alert("❌ A bank with this name already exists");
                    return;
                  }
                  setBanks([...banks, { name: bankName.trim(), amount: 0 }]);
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-dashed transition-all hover:border-indigo-400 hover:text-indigo-500 group"
              style={{ borderColor: t.borderStrong, color: t.textMuted }}
            >
              <Plus
                size={14}
                className="group-hover:text-indigo-500 transition-colors"
              />
              Add Bank Account
            </button>
            {filteredBanks.map((bank) => (
              <div
                key={bank.name}
                onClick={() => setBankModal({ show: true, bank })}
                className="rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group"
                style={{
                  background:
                    "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
                  boxShadow: "0 2px 8px rgba(29,78,216,0.2)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-blue-300 mb-0.5">Bank</div>
                    <div className="text-sm font-semibold text-white truncate">
                      {bank.name}
                    </div>
                    <div className="text-lg font-bold text-white mt-1">
                      ৳ {bank.amount.toLocaleString()}
                    </div>
                  </div>
                  <Pencil
                    size={12}
                    className="text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0"
                  />
                </div>
              </div>
            ))}
            {banks.length > 0 && filteredBanks.length === 0 && (
              <p
                className="text-center text-sm py-6"
                style={{ color: t.textMuted }}
              >
                No banks match
              </p>
            )}
            <div
              onClick={() => setCashModal(true)}
              className="rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                boxShadow: "0 2px 8px rgba(5,150,105,0.2)",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-emerald-300 mb-0.5">
                    Available
                  </div>
                  <div className="text-sm font-semibold text-white">Cash</div>
                  <div className="text-lg font-bold text-white mt-1">
                    ৳ {inCash.toLocaleString()}
                  </div>
                </div>
                <Pencil
                  size={12}
                  className="text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE PANEL — Months */}
        <div
          className="w-[240px] flex-shrink-0 flex flex-col border-r"
          style={{ background: t.surface, borderColor: t.border }}
        >
          <div
            className="px-5 pt-5 pb-4 border-b"
            style={{ borderColor: t.border }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: t.textMuted }}
            >
              Timeline
            </span>
            <div className="mt-3">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: t.textMuted }}
                />
                <input
                  type="text"
                  value={monthSearch}
                  onChange={(e) => setMonthSearch(e.target.value)}
                  placeholder="Search months…"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                  style={{
                    background: t.inputBg,
                    border: `1px solid ${t.border}`,
                    color: t.text,
                  }}
                />
              </div>
            </div>
          </div>
          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin"
            style={{ scrollbarColor: `${t.borderStrong} transparent` }}
          >
            <button
              onClick={() => setAddMonthModalOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-dashed transition-all hover:border-indigo-400 hover:text-indigo-500 group"
              style={{ borderColor: t.borderStrong, color: t.textMuted }}
            >
              <Plus size={14} />
              Add Month
            </button>
            {filteredMonths.map((month) => {
              const total = month.spendings.reduce((s, x) => s + x.cost, 0);
              const isSelected = selectedMonth === month.name;
              const isEarliest =
                new Date(month.name + " 1").getTime() ===
                Math.min(
                  ...months.map((m) => new Date(m.name + " 1").getTime()),
                );
              const isLatest =
                new Date(month.name + " 1").getTime() ===
                Math.max(
                  ...months.map((m) => new Date(m.name + " 1").getTime()),
                );
              const canDelete = (isEarliest || isLatest) && total === 0;
              return (
                <div
                  key={month.name}
                  onClick={() => setSelectedMonth(month.name)}
                  className="relative group rounded-xl px-3 py-3 cursor-pointer transition-all"
                  style={
                    isSelected
                      ? {
                          background: t.accent,
                          boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                        }
                      : { background: "transparent" }
                  }
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = t.surfaceAlt;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div className="flex items-center justify-between pr-6">
                    <div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: isSelected ? "#fff" : t.text }}
                      >
                        {month.name}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{
                          color: isSelected
                            ? "rgba(255,255,255,0.65)"
                            : t.textSub,
                        }}
                      >
                        {month.spendings.length} entries
                        {total > 0 && ` · ৳${total.toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete empty month "${month.name}"?`)) {
                          setMonths(
                            months.filter((m) => m.name !== month.name),
                          );
                          if (selectedMonth === month.name)
                            setSelectedMonth(null);
                        }
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                      style={{ background: t.danger, color: "#fff" }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
            {months.length > 0 && filteredMonths.length === 0 && (
              <p
                className="text-center text-sm py-6"
                style={{ color: t.textMuted }}
              >
                No months match
              </p>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Spendings */}
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{ background: t.bg }}
        >
          <div
            className="px-6 py-5 border-b flex items-center justify-between"
            style={{ background: t.surface, borderColor: t.border }}
          >
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: t.textMuted }}
              >
                {selectedMonth ? "Spendings" : "Overview"}
              </span>
              <h2
                className="text-xl font-bold mt-0.5"
                style={{ color: t.text }}
              >
                {selectedMonth || "Select a month"}
              </h2>
            </div>
            {selectedMonthData && (
              <div className="flex items-center gap-3">
                <div
                  onClick={() => {
                    setSubItemSearchQuery("");
                    setSubItemSearchModalOpen(true);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                    boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
                  }}
                >
                  <div>
                    <div className="text-xs text-red-300">Month Total</div>
                    <div className="text-lg font-bold text-white">
                      ৳ {totalSpending.toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSpendingModal({
                      show: true,
                      spending: null,
                      monthName: selectedMonth!,
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{
                    background: t.accent,
                    boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                  }}
                >
                  <Plus size={16} />
                  Add Spending
                </button>
              </div>
            )}
          </div>
          {selectedMonthData ? (
            <div
              className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin"
              style={{ scrollbarColor: `${t.borderStrong} transparent` }}
            >
              {selectedMonthData.spendings.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-full gap-3"
                  style={{ color: t.textMuted }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: t.surfaceAlt }}
                  >
                    <Plus size={28} style={{ color: t.textMuted }} />
                  </div>
                  <p className="text-sm font-medium">No spendings yet</p>
                  <p className="text-xs">Click &quot;Add Spending&quot; to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...selectedMonthData.spendings]
                    .sort((a, b) => parseInt(a.date) - parseInt(b.date))
                    .map((spending) => {
                      const key = `${spending.date}-${spending.item}`;
                      const isChecked = selectedSpendingDates.has(key);
                      const parsed = parseItem(spending.item);
                      const subCount = Object.keys(parsed).filter(
                        (k) => k !== "Name",
                      ).length;
                      return (
                        <div
                          key={key}
                          className="group flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all border"
                          style={{
                            background: isChecked ? t.surface : t.surfaceAlt,
                            borderColor: isChecked ? t.border : "transparent",
                            opacity: isChecked ? 1 : 0.45,
                            boxShadow: isChecked ? t.shadow : "none",
                          }}
                        >
                          <button
                            onClick={() => {
                              const newSet = new Set(selectedSpendingDates);
                              if (newSet.has(key)) newSet.delete(key);
                              else newSet.add(key);
                              setSelectedSpendingDates(newSet);
                            }}
                            className="flex-shrink-0 transition-all"
                          >
                            {isChecked ? (
                              <CheckCircle2
                                size={18}
                                style={{ color: t.accent }}
                              />
                            ) : (
                              <Circle
                                size={18}
                                style={{ color: t.textMuted }}
                              />
                            )}
                          </button>
                          <div
                            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{
                              background: t.accentSoft,
                              color: t.accent,
                            }}
                          >
                            {spending.date}
                          </div>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() =>
                              setSpendingModal({
                                show: true,
                                spending,
                                monthName: selectedMonth!,
                              })
                            }
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm font-semibold truncate"
                                style={{ color: t.text }}
                              >
                                {parsed.Name as string}
                              </span>
                              {subCount > 0 && (
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0"
                                  style={{
                                    background: t.surfaceAlt,
                                    color: t.textSub,
                                  }}
                                >
                                  {subCount} items
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className="flex-shrink-0 text-right cursor-pointer"
                            onClick={() =>
                              setSpendingModal({
                                show: true,
                                spending,
                                monthName: selectedMonth!,
                              })
                            }
                          >
                            <div
                              className="text-sm font-bold"
                              style={{ color: t.danger }}
                            >
                              ৳ {spending.cost.toLocaleString()}
                            </div>
                          </div>
                          <Pencil
                            size={13}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            style={{ color: t.textMuted }}
                            onClick={() =>
                              setSpendingModal({
                                show: true,
                                spending,
                                monthName: selectedMonth!,
                              })
                            }
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-4"
              style={{ color: t.textMuted }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: t.surface }}
              >
                <BarChart2 size={32} style={{ color: t.textMuted }} />
              </div>
              <div className="text-center">
                <p
                  className="text-base font-semibold"
                  style={{ color: t.textSub }}
                >
                  Select a month
                </p>
                <p className="text-sm mt-1">
                  Pick a month from the timeline to view spendings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE / TABLET LAYOUT (below lg) ─────────────────────────────── */}
      <div
        className="flex lg:hidden flex-col"
        style={{
          background: t.bg,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          height: "100dvh",
          paddingTop: "63px",
          paddingBottom: "0",
        }}
      >
        {/* Mobile top header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ background: t.surface, borderColor: t.border }}
        >
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: t.textMuted }}
            >
              {mobileTab === "accounts"
                ? "Accounts"
                : mobileTab === "timeline"
                  ? "Timeline"
                  : "Spendings"}
            </span>
            {mobileTab === "spendings" && selectedMonth && (
              <p className="text-sm font-bold" style={{ color: t.text }}>
                {selectedMonth}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mobileTab === "accounts" && (
              <button
                onClick={() => router.push("/stats")}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg"
                style={{ background: t.accentSoft, color: t.accent }}
              >
                <BarChart2 size={13} />
                Stats
              </button>
            )}
            {hasUnsavedChanges() && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white"
                style={{ background: t.success }}
              >
                <Save size={12} />
                {isSaving ? "…" : "Save"}
              </button>
            )}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden" style={{ background: t.bg }}>
          {mobileTab === "accounts" && <AccountsPanel />}
          {mobileTab === "timeline" && <TimelinePanel />}
          {mobileTab === "spendings" && <SpendingsPanel />}
        </div>

        {/* Bottom tab bar */}
        <div
          className="flex-shrink-0 border-t flex items-stretch"
          style={{
            background: t.surface,
            borderColor: t.border,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {(
            [
              { id: "accounts", label: "Accounts", icon: Wallet },
              { id: "timeline", label: "Timeline", icon: Calendar },
              { id: "spendings", label: "Spendings", icon: Receipt },
            ] as { id: MobileTab; label: string; icon: React.ElementType }[]
          ).map(({ id, label, icon: Icon }) => {
            const isActive = mobileTab === id;
            // Badge counts
            const badge =
              id === "timeline"
                ? months.length
                : id === "spendings"
                  ? (selectedMonthData?.spendings.length ?? 0)
                  : banks.length + 1; // +1 for cash

            return (
              <button
                key={id}
                onClick={() => setMobileTab(id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-all"
                style={{ color: isActive ? t.accent : t.textMuted }}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                  {badge > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 text-[9px] font-bold rounded-full px-1 min-w-[14px] h-[14px] flex items-center justify-center"
                      style={{
                        background: isActive ? t.accent : t.borderStrong,
                        color: isActive ? "#fff" : t.textSub,
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{label}</span>
                {isActive && (
                  <div
                    className="w-4 h-0.5 rounded-full"
                    style={{ background: t.accent }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MODALS (shared between mobile & desktop) ─────────────────────── */}

      {bankModal.show && bankModal.bank && (
        <BankModal
          bank={bankModal.bank}
          banks={banks}
          onClose={() => setBankModal({ show: false, bank: null })}
          onDeposit={handleBankDeposit}
          onWithdraw={handleBankWithdraw}
          onTransfer={handleBankTransfer}
          onRename={handleRenameBank}
        />
      )}

      {totalBalanceModalOpen && (
        <TotalBalanceModal
          isOpen={totalBalanceModalOpen}
          onClose={() => setTotalBalanceModalOpen(false)}
          banks={banks}
          selectedBanks={selectedBanks}
          setSelectedBanks={setSelectedBanks}
          inCash={inCash}
          theme={theme}
        />
      )}

      {cashModal && (
        <CashModal
          inCash={inCash}
          banks={banks}
          onClose={() => setCashModal(false)}
          onDeposit={handleCashDeposit}
          onUpdateCash={setInCash}
          onEarnCash={handleEarnCash}
        />
      )}

      {spendingModal.show && (
        <SpendingModal
          spending={spendingModal.spending}
          monthName={spendingModal.monthName}
          existingDates={selectedMonthData?.spendings.map((s) => s.date) || []}
          onClose={() =>
            setSpendingModal({ show: false, spending: null, monthName: "" })
          }
          onAdd={handleAddSpending}
          onUpdate={handleUpdateSpending}
          onDelete={handleDeleteSpending}
        />
      )}

      <AddMonthModal
        isOpen={addMonthModalOpen}
        onClose={() => setAddMonthModalOpen(false)}
        months={months}
        onAddMonth={handleAddMonth}
      />

      <SubItemSearchModal
        isOpen={subItemSearchModalOpen}
        onClose={() => setSubItemSearchModalOpen(false)}
        spendings={selectedMonthData?.spendings || []}
        theme={theme}
      />
    </>
  ) : (
    <EmailNotVerified />
  );
}

// ─── Shared Modal Shell ───────────────────────────────────────────────────────

function ModalShell({
  children,
  onClose,
  title,
  width = "max-w-md",
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  width?: string;
}) {
  const { theme } = useTheme();
  const t = tk(theme);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
    >
      <div
        className={`w-full ${width} rounded-t-2xl sm:rounded-2xl overflow-hidden`}
        style={{
          background: t.surface,
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          border: `1px solid ${t.border}`,
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: t.border }}
        >
          {/* Bottom sheet drag handle (mobile) */}
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full sm:hidden"
            style={{ background: t.borderStrong }}
          />
          <h3 className="text-base font-bold" style={{ color: t.text }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: t.textMuted }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = t.surfaceAlt)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

function StyledInput({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const { theme } = useTheme();
  const t = tk(theme);
  return (
    <div>
      {label && (
        <label
          className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
          style={{ color: t.textMuted }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{
          background: t.inputBg,
          border: `1px solid ${t.border}`,
          color: t.text,
          ...props.style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#6366f1";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
          if (props.onFocus) props.onFocus(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = t.border;
          e.currentTarget.style.boxShadow = "none";
          if (props.onBlur) props.onBlur(e);
        }}
      />
    </div>
  );
}

function StyledSelect({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const { theme } = useTheme();
  const t = tk(theme);
  return (
    <div>
      {label && (
        <label
          className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
          style={{ color: t.textMuted }}
        >
          {label}
        </label>
      )}
      <select
        {...props}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{
          background: t.inputBg,
          border: `1px solid ${t.border}`,
          color: t.text,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#6366f1";
          if (props.onFocus) props.onFocus(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = t.border;
          if (props.onBlur) props.onBlur(e);
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabBtn({
  label,
  active,
  onClick,
  color = "#6366f1",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  const { theme } = useTheme();
  const t = tk(theme);
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
      style={
        active
          ? {
              background: color,
              color: "#fff",
              boxShadow: `0 2px 6px ${color}55`,
            }
          : { background: t.surfaceAlt, color: t.textSub }
      }
    >
      {label}
    </button>
  );
}

// ─── Primary action button ────────────────────────────────────────────────────

function PrimaryBtn({
  children,
  onClick,
  color = "#6366f1",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: color, boxShadow: `0 2px 8px ${color}44` }}
    >
      {children}
    </button>
  );
}

// ─── Balance chip ─────────────────────────────────────────────────────────────

function BalanceChip({
  label,
  amount,
  color,
  theme,
}: {
  label: string;
  amount: number;
  color: string;
  theme: boolean;
}) {
  const t = tk(theme);
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: t.surfaceAlt, border: `1px solid ${t.border}` }}
    >
      <div className="text-xs font-medium mb-1" style={{ color: t.textMuted }}>
        {label}
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {" "}
        ৳ {amount.toLocaleString()}
      </div>
    </div>
  );
}

// ─── Bank Modal ───────────────────────────────────────────────────────────────

function BankModal({
  bank,
  banks,
  onClose,
  onDeposit,
  onWithdraw,
  onTransfer,
  onRename,
}: {
  bank: IBank;
  banks: IBank[];
  onClose: () => void;
  onDeposit: (name: string, amount: number) => void;
  onWithdraw: (name: string, amount: number) => void;
  onTransfer: (from: string, to: string, amount: number) => void;
  onRename: (oldName: string, newName: string) => void;
}) {
  const { theme } = useTheme();
  const t = tk(theme);
  const [action, setAction] = useState<
    "deposit" | "withdraw" | "transfer" | "rename"
  >("deposit");
  const [amount, setAmount] = useState("");
  const [targetBank, setTargetBank] = useState("");
  const [newBankName, setNewBankName] = useState(bank.name);

  const handleSubmit = () => {
    if (action === "rename") {
      if (newBankName === bank.name) {
        alert("ℹ️ Name is the same as before");
        return;
      }
      onRename(bank.name, newBankName);
      onClose();
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert("❌ Please enter a valid amount");
      return;
    }
    if (action === "deposit") onDeposit(bank.name, amt);
    else if (action === "withdraw") onWithdraw(bank.name, amt);
    else if (action === "transfer") {
      if (!targetBank) {
        alert("❌ Please select a target bank");
        return;
      }
      onTransfer(bank.name, targetBank, amt);
    }
    onClose();
  };

  const actionColors = {
    deposit: t.success,
    withdraw: t.danger,
    transfer: "#3b82f6",
    rename: t.warning,
  };

  return (
    <ModalShell title={bank.name} onClose={onClose} width="max-w-md">
      <div className="space-y-5">
        <BalanceChip
          label="Current Balance"
          amount={bank.amount}
          color={t.success}
          theme={theme}
        />
        <div className="grid grid-cols-4 gap-1.5">
          {(["deposit", "withdraw", "transfer", "rename"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAction(a)}
              className="py-2 rounded-lg text-xs font-semibold capitalize transition-all"
              style={
                action === a
                  ? {
                      background: actionColors[a],
                      color: "#fff",
                      boxShadow: `0 2px 6px ${actionColors[a]}44`,
                    }
                  : { background: t.surfaceAlt, color: t.textSub }
              }
            >
              {a === "deposit" && (
                <ArrowDownToLine size={11} className="inline mr-1" />
              )}
              {a === "withdraw" && (
                <ArrowUpFromLine size={11} className="inline mr-1" />
              )}
              {a === "transfer" && <Send size={11} className="inline mr-1" />}
              {a}
            </button>
          ))}
        </div>
        {action === "rename" ? (
          <>
            <StyledInput
              label="New Bank Name"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              autoFocus
            />
            <p className="text-xs" style={{ color: t.warning }}>
              This will update the bank name everywhere.
            </p>
          </>
        ) : (
          <>
            <StyledInput
              label="Amount (৳)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            {action === "transfer" && (
              <StyledSelect
                label="Transfer To"
                value={targetBank}
                onChange={(e) => setTargetBank(e.target.value)}
              >
                <option value="">Select bank…</option>
                {banks
                  .filter((b) => b.name !== bank.name)
                  .map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
              </StyledSelect>
            )}
          </>
        )}
        <PrimaryBtn
          onClick={handleSubmit}
          color={action === "rename" ? t.warning : actionColors[action]}
        >
          {action === "rename"
            ? "Rename Bank"
            : `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`}
        </PrimaryBtn>
      </div>
    </ModalShell>
  );
}

// ─── Total Balance Modal ──────────────────────────────────────────────────────

function TotalBalanceModal({
  isOpen,
  onClose,
  banks,
  selectedBanks,
  setSelectedBanks,
  inCash,
  theme,
}: {
  isOpen: boolean;
  onClose: () => void;
  banks: IBank[];
  selectedBanks: string[];
  setSelectedBanks: (names: string[]) => void;
  inCash: number;
  theme: boolean;
}) {
  if (!isOpen) return null;
  const t = tk(theme);
  const allSelected = banks.length > 0 && selectedBanks.length === banks.length;
  const selectedTotal = banks
    .filter((b) => selectedBanks.includes(b.name))
    .reduce((s, b) => s + b.amount, 0);
  const toggleBank = (name: string) =>
    setSelectedBanks(
      selectedBanks.includes(name)
        ? selectedBanks.filter((n) => n !== name)
        : [...selectedBanks, name],
    );
  const toggleAll = () =>
    setSelectedBanks(allSelected ? [] : banks.map((b) => b.name));

  return (
    <ModalShell title="Balance Calculator" onClose={onClose} width="max-w-lg">
      <div className="space-y-5">
        <div>
          <p
            className="text-xs mb-3 font-semibold uppercase tracking-wide"
            style={{ color: t.textMuted }}
          >
            Select Accounts
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleAll}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={
                allSelected
                  ? { background: "#8b5cf6", color: "#fff" }
                  : { background: t.surfaceAlt, color: t.textSub }
              }
            >
              All
            </button>
            {banks.map((bank) => {
              const sel = selectedBanks.includes(bank.name);
              return (
                <button
                  key={bank.name}
                  onClick={() => toggleBank(bank.name)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={
                    sel
                      ? { background: "#6366f1", color: "#fff" }
                      : { background: t.surfaceAlt, color: t.textSub }
                  }
                >
                  {bank.name}
                </button>
              );
            })}
          </div>
        </div>
        <div
          className="rounded-xl p-5"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
          }}
        >
          <div className="text-xs text-indigo-200 mb-1">Selected Total</div>
          <div className="text-3xl font-bold text-white">
            ৳ {selectedTotal.toLocaleString()}
          </div>
          <div className="text-xs text-indigo-300 mt-2">
            Cash (excluded): ৳ {inCash.toLocaleString()}
          </div>
        </div>
        <PrimaryBtn onClick={onClose}>Done</PrimaryBtn>
      </div>
    </ModalShell>
  );
}

// ─── Cash Modal ───────────────────────────────────────────────────────────────

function CashModal({
  inCash,
  banks,
  onClose,
  onDeposit,
  onUpdateCash,
  onEarnCash,
}: {
  inCash: number;
  banks: IBank[];
  onClose: () => void;
  onDeposit: (bank: string, amount: number) => void;
  onUpdateCash: (amount: number) => void;
  onEarnCash: (amount: number) => void;
}) {
  const { theme } = useTheme();
  const t = tk(theme);
  const [action, setAction] = useState<"deposit" | "earn">("deposit");
  const [amount, setAmount] = useState("");
  const [targetBank, setTargetBank] = useState("");

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert("❌ Please enter a valid amount");
      return;
    }
    if (action === "deposit") {
      if (!targetBank) {
        alert("❌ Please select a bank");
        return;
      }
      onDeposit(targetBank, amt);
    } else {
      onUpdateCash(inCash + amt);
      onEarnCash(amt);
    }
    onClose();
  };

  return (
    <ModalShell title="Cash Management" onClose={onClose}>
      <div className="space-y-5">
        <BalanceChip
          label="Available Cash"
          amount={inCash}
          color={t.success}
          theme={theme}
        />
        <div className="flex gap-2">
          <TabBtn
            label="Deposit to Bank"
            active={action === "deposit"}
            onClick={() => setAction("deposit")}
            color="#3b82f6"
          />
          <TabBtn
            label="Earn Cash"
            active={action === "earn"}
            onClick={() => setAction("earn")}
            color={t.success}
          />
        </div>
        <StyledInput
          label={
            action === "earn" ? "Amount Earned (৳)" : "Amount to Deposit (৳)"
          }
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
        {action === "deposit" && (
          <StyledSelect
            label="Deposit Into"
            value={targetBank}
            onChange={(e) => setTargetBank(e.target.value)}
          >
            <option value="">Select bank…</option>
            {banks.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </StyledSelect>
        )}
        <PrimaryBtn
          onClick={handleSubmit}
          color={action === "deposit" ? "#3b82f6" : t.success}
        >
          Confirm
        </PrimaryBtn>
      </div>
    </ModalShell>
  );
}

// ─── Spending Modal ───────────────────────────────────────────────────────────

function SpendingModal({
  spending,
  monthName,
  existingDates,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: {
  spending: ISpending | null;
  monthName: string;
  existingDates: string[];
  onClose: () => void;
  onAdd: (month: string, spending: ISpending) => void;
  onUpdate: (month: string, old: ISpending, updated: ISpending) => void;
  onDelete: (month: string, spending: ISpending) => void;
}) {
  const { theme } = useTheme();
  const t = tk(theme);
  const [name, setName] = useState("Multiple Spendings");
  const [subItems, setSubItems] = useState<
    { subName: string; subCost: number }[]
  >([]);

  const getNextMissingDate = (): string => {
    if (!existingDates || existingDates.length === 0) return "1";
    const used = new Set(
      existingDates
        .map((d) => parseInt(d, 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 31),
    );
    for (let d = 1; d <= 31; d++) if (!used.has(d)) return d.toString();
    return "";
  };

  const isAddingNew = spending === null;
  const [date, setDate] = useState<string>(
    isAddingNew ? getNextMissingDate() : spending?.date || "",
  );

  useEffect(() => {
    if (spending) {
      const parsed = parseItem(spending.item);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(parsed.Name as string);
      setSubItems(
        Object.entries(parsed)
          .filter(([k]) => k !== "Name")
          .map(([n, c]) => ({ subName: n, subCost: Number(c) })),
      );
    }
  }, [spending]);

  const totalCost = subItems.reduce((s, x) => s + x.subCost, 0);

  const handleSubmit = () => {
    const dateNum = parseInt(date);
    if (!date || dateNum < 1 || dateNum > 31) {
      alert("❌ Date must be between 1 and 31");
      return;
    }
    if (!name.trim()) {
      alert("❌ Please enter a name");
      return;
    }
    if (subItems.some((s) => !s.subName.trim() || s.subCost <= 0)) {
      alert("❌ All items must have a name and positive cost");
      return;
    }
    if (totalCost <= 0) {
      alert("❌ Total cost must be positive");
      return;
    }

    const itemObj: { [key: string]: string | number } = { Name: name.trim() };
    subItems.forEach((s) => {
      itemObj[s.subName.trim()] = s.subCost;
    });
    const newSpending: ISpending = {
      date,
      item: JSON.stringify(itemObj),
      cost: totalCost,
    };

    if (spending) {
      if (spending.date !== date && existingDates.includes(date)) {
        alert("❌ A spending already exists for this date");
        return;
      }
      onUpdate(monthName, spending, newSpending);
    } else {
      if (existingDates.includes(date)) {
        alert("❌ A spending already exists for this date");
        return;
      }
      onAdd(monthName, newSpending);
    }
    onClose();
  };

  return (
    <ModalShell
      title={spending ? "Edit Spending" : "New Spending"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <StyledInput
              label="Day (1–31)"
              type="number"
              min="1"
              max="31"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {isAddingNew && date && (
              <p className="text-xs mt-1" style={{ color: t.success }}>
                ✓ Next available date
              </p>
            )}
          </div>
          <StyledInput
            label="Display Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Sub-items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: t.textMuted }}
            >
              Items
            </label>
            <button
              onClick={() =>
                setSubItems([...subItems, { subName: "", subCost: 0 }])
              }
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
              style={{ background: t.accentSoft, color: t.accent }}
            >
              <Plus size={11} /> Add Item
            </button>
          </div>

          <div className="space-y-2 max-h-[35vh] overflow-y-auto">
            {subItems.map((sub, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={sub.subName}
                  onChange={(e) => {
                    const u = [...subItems];
                    u[i].subName = e.target.value;
                    setSubItems(u);
                  }}
                  placeholder="Item name"
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: t.inputBg,
                    border: `1px solid ${t.border}`,
                    color: t.text,
                  }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={
                    sub.subCost === 0
                      ? ""
                      : sub.subCost.toString().replace(/^0+/, "")
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    const u = [...subItems];
                    u[i].subCost = parseFloat(raw) || 0;
                    setSubItems(u);
                  }}
                  placeholder="Cost"
                  className="w-20 px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: t.inputBg,
                    border: `1px solid ${t.border}`,
                    color: t.text,
                  }}
                />
                <button
                  onClick={() =>
                    setSubItems(subItems.filter((_, j) => j !== i))
                  }
                  className="p-2 rounded-lg transition-colors flex-shrink-0"
                  style={{ background: "#ef444420", color: t.danger }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {subItems.length === 0 && (
              <div
                className="text-center py-4 rounded-xl border border-dashed text-xs"
                style={{ borderColor: t.border, color: t.textMuted }}
              >
                No items yet — tap &quot;Add Item&quot; above
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{
            background: t.accentSoft,
            border: `1px solid ${t.accent}33`,
          }}
        >
          <span className="text-sm font-semibold" style={{ color: t.accent }}>
            Total
          </span>
          <span className="text-lg font-bold" style={{ color: t.accent }}>
            ৳ {totalCost.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        {spending && (
          <button
            onClick={() => {
              if (confirm("Delete this spending?")) {
                onDelete(monthName, spending);
                onClose();
              }
            }}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: t.danger }}
          >
            Delete
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: t.accent, boxShadow: `0 2px 8px ${t.accent}44` }}
        >
          {spending ? "Update" : "Add Spending"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Add Month Modal ──────────────────────────────────────────────────────────

function AddMonthModal({
  isOpen,
  onClose,
  months,
  onAddMonth,
}: {
  isOpen: boolean;
  onClose: () => void;
  months: IMonth[];
  onAddMonth: (name: string) => void;
}) {
  const { theme } = useTheme();
  const t = tk(theme);
  if (!isOpen) return null;

  if (months.length === 0) {
    const now = new Date();
    const currentMonthName = now.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    return (
      <ModalShell title="Add Month" onClose={onClose}>
        <div className="space-y-4">
          <p className="text-sm" style={{ color: t.textSub }}>
            No months yet. Start tracking with the current month?
          </p>
          <PrimaryBtn
            onClick={() => {
              onAddMonth(currentMonthName);
              onClose();
            }}
            color={t.success}
          >
            Create {currentMonthName}
          </PrimaryBtn>
        </div>
      </ModalShell>
    );
  }

  const sorted = [...months].sort(
    (a, b) =>
      new Date(a.name + " 1").getTime() - new Date(b.name + " 1").getTime(),
  );
  const prevDate = new Date(sorted[0].name + " 1");
  prevDate.setMonth(prevDate.getMonth() - 1);
  const nextDate = new Date(sorted[sorted.length - 1].name + " 1");
  nextDate.setMonth(nextDate.getMonth() + 1);
  const prevName = prevDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const nextName = nextDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <ModalShell title="Add Month" onClose={onClose}>
      <div className="space-y-3">
        <button
          onClick={() => {
            onAddMonth(prevName);
            onClose();
          }}
          className="w-full px-4 py-4 rounded-xl text-left transition-all hover:scale-[1.01] border"
          style={{ background: t.surfaceAlt, borderColor: t.border }}
        >
          <div
            className="text-xs font-semibold mb-1"
            style={{ color: t.textMuted }}
          >
            ← Previous
          </div>
          <div className="text-sm font-bold" style={{ color: t.text }}>
            {prevName}
          </div>
        </button>
        <button
          onClick={() => {
            onAddMonth(nextName);
            onClose();
          }}
          className="w-full px-4 py-4 rounded-xl text-left transition-all hover:scale-[1.01] border"
          style={{ background: t.surfaceAlt, borderColor: t.border }}
        >
          <div
            className="text-xs font-semibold mb-1"
            style={{ color: t.textMuted }}
          >
            Next →
          </div>
          <div className="text-sm font-bold" style={{ color: t.text }}>
            {nextName}
          </div>
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Sub-Item Search Modal ────────────────────────────────────────────────────

function SubItemSearchModal({
  isOpen,
  onClose,
  spendings,
  theme,
}: {
  isOpen: boolean;
  onClose: () => void;
  spendings: ISpending[];
  theme: boolean;
}) {
  const t = tk(theme);
  const [search, setSearch] = useState("");
  if (!isOpen) return null;

  const lower = search.toLowerCase().trim();
  const items = spendings
    .flatMap((sp) => {
      const parsed = parseItem(sp.item);
      return Object.entries(parsed)
        .filter(([k]) => k !== "Name")
        .map(([subName, subCost]) => ({
          date: sp.date,
          mainName: parsed.Name as string,
          subName,
          subCost: Number(subCost),
        }));
    })
    .filter((e) => lower === "" || e.subName.toLowerCase().includes(lower))
    .sort((a, b) => parseInt(a.date) - parseInt(b.date));

  const total = items.reduce((s, x) => s + x.subCost, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          maxHeight: "92dvh",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: t.borderStrong }}
          />
        </div>
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: t.border }}
        >
          <div>
            <h3 className="text-base font-bold" style={{ color: t.text }}>
              Sub-Items Breakdown
            </h3>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>
              {items.length} items · ৳ {total.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: t.textMuted }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = t.surfaceAlt)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <X size={18} />
          </button>
        </div>
        {/* Search */}
        <div
          className="px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor: t.border }}
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: t.textMuted }}
            />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items… (e.g. Coffee, Petrol)"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none"
              style={{
                background: t.inputBg,
                border: `1px solid ${t.border}`,
                color: t.text,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = t.border;
              }}
            />
          </div>
        </div>
        {/* Total strip */}
        <div
          className="px-5 py-3 flex items-center justify-between border-b flex-shrink-0"
          style={{ borderColor: t.border, background: t.surfaceAlt }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: t.textMuted }}
          >
            {search.trim() ? "Filtered Total" : "Month Total"}
          </span>
          <span className="text-lg font-bold" style={{ color: t.danger }}>
            ৳ {total.toLocaleString()}
          </span>
        </div>
        {/* List */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4 space-y-2 scrollbar-thin"
          style={{ scrollbarColor: `${t.borderStrong} transparent` }}
        >
          {items.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 gap-2"
              style={{ color: t.textMuted }}
            >
              <Search size={28} className="opacity-30" />
              <p className="text-sm">
                {search.trim() ? "No matching items" : "No sub-items yet"}
              </p>
            </div>
          ) : (
            items.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl px-4 py-3 border"
                style={{ background: t.surface, borderColor: t.border }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: t.accentSoft, color: "#6366f1" }}
                >
                  {entry.date}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs" style={{ color: t.textMuted }}>
                    {entry.mainName}
                  </div>
                  <div
                    className="text-sm font-semibold truncate"
                    style={{ color: t.text }}
                  >
                    {entry.subName}
                  </div>
                </div>
                <div
                  className="text-sm font-bold flex-shrink-0"
                  style={{ color: t.danger }}
                >
                  ৳ {entry.subCost.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
