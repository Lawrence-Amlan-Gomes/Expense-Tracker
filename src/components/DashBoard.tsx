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
} from "@/store/features/auth/authSlice";
import {
  X,
  Plus,
  Save,
  Send,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

export default function DashBoard() {
  const { theme } = useTheme();
  const [hasMounted, setHasMounted] = useState(false);
  const { user: auth, setAuth } = useAuth();
  const router = useRouter();

  // Local state for money management
  const [banks, setBanks] = useState<IBank[]>([]);
  const [inCash, setInCash] = useState<number>(0);
  const [months, setMonths] = useState<IMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [monthSearch, setMonthSearch] = useState("");
  const [originalMoney, setOriginalMoney] = useState<IMoney | null>(null);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);

  // Modal states
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

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (auth === null && hasMounted) {
      router.push("/login");
    } else if (auth?.money) {
      setBanks(auth.money.banks || []);
      setInCash(auth.money.inCash || 0);
      setMonths(auth.money.Months || []);

      // Save the original state for comparison
      setOriginalMoney(auth.money);
    }
  }, [auth, hasMounted, router]);

  // Auto-select current month if it exists
  useEffect(() => {
    if (months.length > 0 && selectedMonth === null) {
      const now = new Date();
      const currentMonthName = now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }); // e.g., "December 2025"

      const currentMonthExists = months.find(
        (m) => m.name === currentMonthName,
      );

      if (currentMonthExists) {
        setSelectedMonth(currentMonthName);
      } else {
        // Optional: fallback to the latest month
        const sortedMonths = [...months].sort((a, b) => {
          return (
            new Date(b.name + " 1").getTime() -
            new Date(a.name + " 1").getTime()
          );
        });
        if (sortedMonths.length > 0) {
          setSelectedMonth(sortedMonths[0].name); // Select the most recent month
        }
      }
    }
  }, [months, selectedMonth]); // Run when months load or change

  useEffect(() => {
    if (auth?.money) {
      setBanks(auth.money.banks || []);
      setInCash(auth.money.inCash || 0);
      setMonths(auth.money.Months || []);
      setOriginalMoney(auth.money);

      // NEW: pre-select all banks by default
      setSelectedBanks(auth.money.banks?.map((b) => b.name) || []);
    }
  }, [auth, hasMounted, router]);

  const handleSave = async () => {
    if (!auth?.email) return;

    setIsSaving(true);
    try {
      const updatedMoney: IMoney = { banks, inCash, Months: months };
      await updateMoney(auth.email, updatedMoney);

      // Update local auth state
      setAuth({ ...auth, money: updatedMoney });

      // Update originalMoney so "Changes Saved" shows
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
    setBanks(
      banks.map((b) =>
        b.name === bankName ? { ...b, amount: b.amount + amount } : b,
      ),
    );
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
    setBanks(
      banks.map((b) =>
        b.name === bankName ? { ...b, amount: b.amount + amount } : b,
      ),
    );
    setInCash(inCash - amount);
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

    // Deep comparison needed because arrays/objects
    const currentMoney: IMoney = {
      banks,
      inCash,
      Months: months,
    };

    // Simple deep equality check for our structure
    return JSON.stringify(currentMoney) !== JSON.stringify(originalMoney);
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

    // If the renamed bank was selected in transfer or other modals, it should still work
    // because we update by reference — but UI will reflect new name after re-render
  };

  const selectedMonthData = months.find((m) => m.name === selectedMonth);
  const totalSpending =
    selectedMonthData?.spendings.reduce((sum, s) => sum + s.cost, 0) || 0;

  if (!hasMounted) return null;

  return auth?.isEmailVerified ? (
    <div
      className={`h-screen w-full bg-gradient-to-br pt-[63px] flex overflow-hidden`}
    >
      {/* Left Panel - Banks & Cash */}
      <div
        className={`w-1/4 border-r-[1px] flex flex-col ${
          theme ? "border-[#dddddd]" : "border-[#222222]"
        }`}
      >
        <div
          className={`p-6 border-b-[1px] ${
            theme ? "border-[#dddddd]" : "border-[#222222]"
          }`}
        >
          <h2
            className={`text-2xl font-bold ${
              theme ? "text-black" : "text-white"
            } mb-2`}
          >
            Accounts
          </h2>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges()}
            className={`w-full mt-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              isSaving || !hasUnsavedChanges()
                ? theme
                  ? "bg-[#aaaaaa] text-[#444444] cursor-not-allowed"
                  : "bg-[#444444] text-[#aaaaaa] cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            <Save size={20} />
            {isSaving
              ? "Saving..."
              : hasUnsavedChanges()
                ? "Save Changes"
                : "Changes Saved"}
          </button>
        </div>

        <div
          className={`flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4 ${
            theme
              ? "bg-[#ffffff] scrollbar-thumb-black scrollbar-track-[#eeeeee]"
              : "bg-[#000000] scrollbar-thumb-white scrollbar-track-[#222222]"
          }`}
        >
          {/* Bank Search Bar */}
          <input
            type="text"
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
            placeholder="Search banks..."
            className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              theme
                ? "bg-[#f0f0f0] border border-[#cccccc] text-black placeholder:text-[#888888]"
                : "bg-[#111111] border border-[#444444] text-white placeholder:text-[#888888]"
            }`}
          />
          {/* Add Bank Button */}
          <button
            onClick={() => {
              const bankName = prompt("Enter new bank name:");
              if (bankName && bankName.trim()) {
                if (banks.some((b) => b.name === bankName.trim())) {
                  alert("❌ A bank with this name already exists");
                  return;
                }
                setBanks([...banks, { name: bankName.trim(), amount: 0 }]);
              }
            }}
            className={`w-full bg-transparent p-5 rounded-xl cursor-pointer hover:scale-105 transition-transform flex items-center justify-center gap-2 border-2 border-dashed ${
              theme
                ? "text-[#666666] border-[#888888]"
                : "text-[#cccccc] border-[#aaaaaa]"
            }`}
          >
            <Plus size={24} className={``} />
            <span className={`font-bold text-lg`}>Add New Bank</span>
          </button>

          {/* Filtered Bank Cards */}
          {banks
            .filter((bank) =>
              bank.name.toLowerCase().includes(bankSearch.toLowerCase()),
            )
            .map((bank) => (
              <div
                key={bank.name}
                onClick={() => setBankModal({ show: true, bank })}
                className="bg-gradient-to-br from-blue-600 to-blue-800 p-5 rounded-xl cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="text-blue-100 text-sm mb-1">Bank Account</div>
                <div className="text-white font-bold text-lg mb-2">
                  {bank.name}
                </div>
                <div className="text-2xl font-bold text-white">
                  ৳ {bank.amount.toLocaleString()}
                </div>
              </div>
            ))}

          {/* No results message */}
          {banks.length > 0 &&
            banks.filter((bank) =>
              bank.name.toLowerCase().includes(bankSearch.toLowerCase()),
            ).length === 0 && (
              <div
                className={`text-center py-8 ${
                  theme ? "text-[#888888]" : "text-[#999999]"
                }`}
              >
                No banks found
              </div>
            )}
          {/* Cash Card */}
          <div
            onClick={() => setCashModal(true)}
            className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 rounded-xl cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="text-emerald-100 text-sm mb-1">Available Cash</div>
            <div className="text-white font-bold text-lg mb-2">In Cash</div>
            <div className="text-2xl font-bold text-white">
              ৳ {inCash.toLocaleString()}
            </div>
          </div>
          {/* Total Money Card */}
          <div
            onClick={() => setTotalBalanceModalOpen(true)}
            className="bg-gradient-to-br from-purple-600 to-purple-800 p-5 rounded-xl border-2 border-purple-400"
          >
            <div className="text-purple-100 text-sm mb-1">Total Balance</div>
            <div className="text-white font-bold text-lg mb-2">
              All Accounts
            </div>
            <div className="text-2xl font-bold text-white">
              ৳{" "}
              {(
                banks.reduce((sum, b) => sum + b.amount, 0) + inCash
              ).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Panel - Months */}
      <div
        className={`w-1/4 border-r flex flex-col ${
          theme ? "border-[#dddddd]" : "border-[#222222]"
        } `}
      >
        <div
          className={`p-6 border-b ${
            theme ? "border-[#dddddd]" : "border-[#222222]"
          }`}
        >
          <h2
            className={`text-2xl font-bold ${
              theme ? "text-[#000000]" : "text-[#ffffff]"
            }`}
          >
            Months
          </h2>
        </div>
        <div
          className={`flex-1 overflow-y-auto p-6 space-y-3 scrollbar-thin ${
            theme
              ? "bg-[#ffffff] scrollbar-thumb-black scrollbar-track-[#eeeeee]"
              : "bg-[#000000] scrollbar-thumb-white scrollbar-track-[#222222]"
          }`}
        >
          {/* Month Search Bar */}
          <input
            type="text"
            value={monthSearch}
            onChange={(e) => setMonthSearch(e.target.value)}
            placeholder="Search months... (e.g., Dec, 2025)"
            className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              theme
                ? "bg-[#f0f0f0] border border-[#cccccc] text-black placeholder:text-[#888888]"
                : "bg-[#111111] border border-[#444444] text-white placeholder:text-[#888888]"
            }`}
          />

          {/* Add Month Button */}
          <button
            onClick={() => setAddMonthModalOpen(true)}
            className={`w-full bg-transparent p-5 rounded-xl cursor-pointer hover:scale-105 transition-transform flex items-center justify-center gap-2 border-2 border-dashed ${
              theme
                ? "text-[#666666] border-[#888888]"
                : "text-[#cccccc] border-[#aaaaaa]"
            }`}
          >
            <Plus size={20} className="" />
            <span className="font-semibold text-lg">Add Month</span>
          </button>

          {/* Filtered & Sorted Months */}
          {[...months]
            .filter((month) =>
              month.name.toLowerCase().includes(monthSearch.toLowerCase()),
            )
            .sort((a, b) => {
              return (
                new Date(a.name + " 1").getTime() -
                new Date(b.name + " 1").getTime()
              );
            })
            .map((month) => {
              const totalSpending = month.spendings.reduce(
                (sum, s) => sum + s.cost,
                0,
              );

              const isEarliest =
                months.length > 0 &&
                new Date(month.name + " 1").getTime() ===
                  Math.min(
                    ...months.map((m) => new Date(m.name + " 1").getTime()),
                  );

              const isLatest =
                months.length > 0 &&
                new Date(month.name + " 1").getTime() ===
                  Math.max(
                    ...months.map((m) => new Date(m.name + " 1").getTime()),
                  );

              const canDelete = (isEarliest || isLatest) && totalSpending === 0;

              return (
                <div
                  key={month.name}
                  className={`p-4 rounded-lg cursor-pointer transition-all relative group ${
                    selectedMonth === month.name
                      ? "bg-indigo-600"
                      : theme
                        ? "bg-[#eeeeee] hover:bg-[#dddddd] border-[1px] border-[#bbbbbb]"
                        : "bg-[#111111] hover:bg-[#222222] border-[1px] border-[#333333]"
                  }`}
                >
                  <div
                    onClick={() => setSelectedMonth(month.name)}
                    className="pr-8"
                  >
                    <div
                      className={`font-semibold text-lg ${
                        selectedMonth === month.name
                          ? "text-white"
                          : theme
                            ? "text-black"
                            : "text-white"
                      }`}
                    >
                      {month.name}
                    </div>
                    <div
                      className={`text-sm mt-1 ${
                        selectedMonth === month.name
                          ? "text-white"
                          : theme
                            ? "text-black"
                            : "text-[#dddddd]"
                      }`}
                    >
                      {month.spendings.length} spending
                      {month.spendings.length !== 1 ? "s" : ""}
                      {totalSpending > 0 &&
                        ` • ৳ ${totalSpending.toLocaleString()}`}
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
                          if (selectedMonth === month.name) {
                            setSelectedMonth(null);
                          }
                        }
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-2 rounded-md"
                      title="Delete empty month"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              );
            })}

          {/* No results message */}
          {months.length > 0 &&
            months.filter((month) =>
              month.name.toLowerCase().includes(monthSearch.toLowerCase()),
            ).length === 0 && (
              <div
                className={`text-center py-8 ${
                  theme ? "text-[#888888]" : "text-[#999999]"
                }`}
              >
                No months found
              </div>
            )}
        </div>
      </div>

      {/* Right Panel - Spendings */}
      <div className="flex-1 flex flex-col">
        <div
          className={`p-6 border-b ${
            theme ? "border-[#dddddd]" : "border-[#222222]"
          }`}
        >
          <h2
            className={`text-2xl font-bold ${
              theme ? "text-black" : "text-[#ffffff]"
            }`}
          >
            {selectedMonth || "Select a Month"}
          </h2>
        </div>

        {selectedMonthData ? (
          <div
            className={`flex-1 overflow-y-auto p-6 scrollbar-thin ${
              theme
                ? "bg-[#ffffff] scrollbar-thumb-black scrollbar-track-[#eeeeee]"
                : "bg-[#000000] scrollbar-thumb-white scrollbar-track-[#222222]"
            }`}
          >
            <div className="space-y-3 mb-6">
              {[...selectedMonthData.spendings]
                .sort((a, b) => parseInt(a.date) - parseInt(b.date))
                .map((spending) => (
                  <div
                    key={`${spending.date}-${spending.item}`} // Better key than index
                    onClick={() =>
                      setSpendingModal({
                        show: true,
                        spending,
                        monthName: selectedMonth!,
                      })
                    }
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      theme
                        ? "bg-[#f5f5f5] hover:bg-[#e0e0e0] text-black border-[1px] border-[#cccccc]"
                        : "bg-[#111111] hover:bg-[#222222] text-white border-[1px] border-[#333333]"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm">Date: {spending.date}</div>
                        <div className="font-semibold text-lg mt-1">
                          {spending.item}
                        </div>
                      </div>
                      <div className="text-red-600 font-bold text-lg">
                        ৳ {spending.cost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div
              className={`p-5 rounded-lg mb-4  border-2 bg-red-700 border-red-800`}
            >
              <div className="flex justify-between items-center">
                <span className={`font-semibold text-lg text-white`}>
                  Total Spending
                </span>
                <span className=" font-bold text-2xl text-white">
                  ৳ {totalSpending.toLocaleString()}
                </span>
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Add New Spending
            </button>
          </div>
        ) : (
          <div
            className={`flex-1 flex items-center justify-center text-lg ${
              theme ? "text-[#333333]" : "text-[#cccccc]"
            }`}
          >
            Select a month to view spendings
          </div>
        )}
      </div>

      {/* Bank Modal */}
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

      {/* Total Balance Modal */}
      {totalBalanceModalOpen && (
        <TotalBalanceModal
          isOpen={totalBalanceModalOpen}
          onClose={() => setTotalBalanceModalOpen(false)}
          banks={banks}
          selectedBanks={selectedBanks}
          setSelectedBanks={setSelectedBanks}
          inCash={inCash} // optional
          theme={theme}
        />
      )}

      {/* Cash Modal */}
      {cashModal && (
        <CashModal
          inCash={inCash}
          banks={banks}
          onClose={() => setCashModal(false)}
          onDeposit={handleCashDeposit}
          onUpdateCash={setInCash}
        />
      )}

      {/* Spending Modal */}
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

      {/* Add Month Modal */}
      <AddMonthModal
        isOpen={addMonthModalOpen}
        onClose={() => setAddMonthModalOpen(false)}
        months={months}
        onAddMonth={handleAddMonth}
      />
    </div>
  ) : (
    <EmailNotVerified />
  );
}

// Bank Modal Component
function BankModal({
  bank,
  banks,
  onClose,
  onDeposit,
  onWithdraw,
  onTransfer,
  onRename, // ← new callback
}: {
  bank: IBank;
  banks: IBank[];
  onClose: () => void;
  onDeposit: (name: string, amount: number) => void;
  onWithdraw: (name: string, amount: number) => void;
  onTransfer: (from: string, to: string, amount: number) => void;
  onRename: (oldName: string, newName: string) => void;
}) {
  const [action, setAction] = useState<
    "deposit" | "withdraw" | "transfer" | "rename"
  >("deposit");
  const [amount, setAmount] = useState("");
  const [targetBank, setTargetBank] = useState("");
  const [newBankName, setNewBankName] = useState(bank.name); // initial value = current name
  const { theme } = useTheme();

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

    if (action === "deposit") {
      onDeposit(bank.name, amt);
    } else if (action === "withdraw") {
      onWithdraw(bank.name, amt);
    } else if (action === "transfer") {
      if (!targetBank) {
        alert("❌ Please select a target bank");
        return;
      }
      onTransfer(bank.name, targetBank, amt);
    }
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md`}
    >
      <div
        className={`p-8 rounded-2xl w-full max-w-xl ${theme ? "bg-black" : "bg-white"}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-2xl font-bold ${theme ? "text-[#ffffff]" : "text-[#000000]"}`}
          >
            {bank.name}
          </h3>
          <button
            onClick={onClose}
            className="bg-red-600 text-white hover:bg-red-700 p-1 rounded-md"
          >
            <X size={24} />
          </button>
        </div>

        <div
          className={`mb-6 p-4 rounded-lg ${theme ? "bg-emerald-900/30 border border-emerald-700" : "bg-emerald-100/30 border border-emerald-300"}`}
        >
          <div
            className={`text-sm ${theme ? "text-[#ffffff]" : "text-[#000000]"}`}
          >
            Current Balance
          </div>
          <div
            className={`text-2xl font-bold ${theme ? "text-[#ffffff]" : "text-[#000000]"}`}
          >
            ৳ {bank.amount.toLocaleString()}
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setAction("deposit")}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors min-w-[80px] ${
              action === "deposit"
                ? "bg-emerald-600 text-white"
                : theme
                  ? "bg-[#111111] border border-[#555555] text-[#cccccc]"
                  : "bg-[#eeeeee] border border-[#888888] text-[#222222]"
            }`}
          >
            <ArrowDownToLine className="inline mr-1" size={16} /> Deposit
          </button>
          <button
            onClick={() => setAction("withdraw")}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors min-w-[80px] ${
              action === "withdraw"
                ? "bg-red-600 text-white"
                : theme
                  ? "bg-[#111111] border border-[#555555] text-[#cccccc]"
                  : "bg-[#eeeeee] border border-[#888888] text-[#222222]"
            }`}
          >
            <ArrowUpFromLine className="inline mr-1" size={16} /> Withdraw
          </button>
          <button
            onClick={() => setAction("transfer")}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors min-w-[80px] ${
              action === "transfer"
                ? "bg-blue-600 text-white"
                : theme
                  ? "bg-[#111111] border border-[#555555] text-[#cccccc]"
                  : "bg-[#eeeeee] border border-[#888888] text-[#222222]"
            }`}
          >
            <Send className="inline mr-1" size={16} /> Transfer
          </button>
          <button
            onClick={() => setAction("rename")}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors min-w-[80px] ${
              action === "rename"
                ? "bg-amber-600 text-white"
                : theme
                  ? "bg-[#111111] border border-[#555555] text-[#cccccc]"
                  : "bg-[#eeeeee] border border-[#888888] text-[#222222]"
            }`}
          >
            Rename
          </button>
        </div>

        {action === "rename" ? (
          <div className="space-y-4">
            <input
              type="text"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              placeholder="New bank name"
              className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme
                  ? "bg-[#111111] border border-[#555555] text-[#eeeeee]"
                  : "bg-[#eeeeee] border border-[#888888] text-[#111111]"
              }`}
              autoFocus
            />
            <p
              className={`text-sm ${theme ? "text-amber-300" : "text-amber-700"}`}
            >
              Changing the name will update it everywhere in the app.
            </p>
          </div>
        ) : (
          <>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className={`w-full p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme
                  ? "bg-[#111111] border border-[#555555] text-[#eeeeee]"
                  : "bg-[#eeeeee] border border-[#888888] text-[#111111]"
              }`}
            />

            {action === "transfer" && (
              <select
                value={targetBank}
                onChange={(e) => setTargetBank(e.target.value)}
                className={`w-full p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  theme
                    ? "bg-[#111111] border border-[#555555] text-[#eeeeee]"
                    : "bg-[#eeeeee] border border-[#888888] text-[#111111]"
                }`}
              >
                <option value="">Select target bank</option>
                {banks
                  .filter((b) => b.name !== bank.name)
                  .map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
              </select>
            )}
          </>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors mt-2"
        >
          {action === "rename"
            ? "Rename Bank"
            : `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`}
        </button>
      </div>
    </div>
  );
}

// Total Balance Modal Component
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

  const allSelected = banks.length > 0 && selectedBanks.length === banks.length;
  const selectedTotal = banks
    .filter((b) => selectedBanks.includes(b.name))
    .reduce((sum, b) => sum + b.amount, 0);

  const toggleBank = (bankName: string) => {
    setSelectedBanks((prev: string[]) =>           // ← Fixed here
      prev.includes(bankName)
        ? prev.filter((n) => n !== bankName)
        : [...prev, bankName]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedBanks([]);
    } else {
      setSelectedBanks(banks.map((b) => b.name));
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md">
      <div
        className={`p-8 rounded-2xl w-full max-w-lg ${theme ? "bg-black" : "bg-white"}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-2xl font-bold ${theme ? "text-white" : "text-black"}`}
          >
            Select Accounts
          </h3>
          <button
            onClick={onClose}
            className="bg-red-600 text-white hover:bg-red-700 p-2 rounded-md"
          >
            <X size={24} />
          </button>
        </div>

        {/* Capsules */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* All capsule */}
          <button
            onClick={toggleAll}
            className={`px-5 py-2.5 rounded-full font-medium transition-all text-sm
              ${allSelected
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                : theme
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            All
          </button>

          {/* Bank capsules */}
          {banks.map((bank) => {
            const isSelected = selectedBanks.includes(bank.name);
            return (
              <button
                key={bank.name}
                onClick={() => toggleBank(bank.name)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all text-sm
                  ${isSelected
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : theme
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                {bank.name}
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div
          className={`p-5 rounded-xl mb-6 ${
            theme ? "bg-gray-900/60 border border-gray-700" : "bg-gray-50 border border-gray-200"
          }`}
        >
          <div className={`text-sm mb-1 ${theme ? "text-gray-400" : "text-gray-600"}`}>
            Selected Accounts Total
          </div>
          <div className={`text-3xl font-bold ${theme ? "text-white" : "text-black"}`}>
            ৳ {selectedTotal.toLocaleString()}
          </div>

          <div className={`text-sm mt-3 ${theme ? "text-gray-400" : "text-gray-600"}`}>
            Cash not included in selection • ৳ {inCash.toLocaleString()}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// Cash Modal Component
function CashModal({
  inCash,
  banks,
  onClose,
  onDeposit,
  onUpdateCash,
}: {
  inCash: number;
  banks: IBank[];
  onClose: () => void;
  onDeposit: (bank: string, amount: number) => void;
  onUpdateCash: (amount: number) => void;
}) {
  const [action, setAction] = useState<"deposit" | "earn">("deposit");
  const [amount, setAmount] = useState("");
  const [targetBank, setTargetBank] = useState("");
  const { theme } = useTheme(); // assuming useTheme returns { theme: boolean }

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
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md">
      <div
        className={`p-8 rounded-2xl w-full max-w-md ${
          theme ? "bg-black" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-2xl font-bold ${
              theme ? "text-[#ffffff]" : "text-[#000000]"
            }`}
          >
            Cash Management
          </h3>
          <button
            onClick={onClose}
            className="bg-red-600 text-white hover:bg-red-700 p-1 rounded-md"
          >
            <X size={24} />
          </button>
        </div>

        <div
          className={`mb-6 p-4 rounded-lg ${
            theme
              ? "bg-emerald-900/30 border border-emerald-700"
              : "bg-emerald-100/30 border border-emerald-300"
          }`}
        >
          <div
            className={`text-sm ${theme ? "text-[#ffffff]" : "text-[#000000]"}`}
          >
            Current Cash
          </div>
          <div
            className={`text-2xl font-bold ${
              theme ? "text-[#ffffff]" : "text-[#000000]"
            }`}
          >
            ৳ {inCash.toLocaleString()}
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAction("deposit")}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              action === "deposit"
                ? "bg-blue-600 text-white"
                : theme
                  ? "bg-[#111111] border-[1px] border-[#555555] text-[#cccccc]"
                  : "bg-[#eeeeee] border-[1px] border-[#888888] text-[#222222]"
            }`}
          >
            Deposit to Bank
          </button>
          <button
            onClick={() => setAction("earn")}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              action === "earn"
                ? "bg-emerald-600 text-white"
                : theme
                  ? "bg-[#111111] border-[1px] border-[#555555] text-[#cccccc]"
                  : "bg-[#eeeeee] border-[1px] border-[#888888] text-[#222222]"
            }`}
          >
            Earn Cash
          </button>
        </div>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={
            action === "earn"
              ? "Enter amount earned"
              : "Enter amount to deposit"
          }
          className={`w-full p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:border-none focus:ring-indigo-500 ${
            theme
              ? "bg-[#111111] border-[1px] border-[#555555] text-[#eeeeee]"
              : "bg-[#eeeeee] border-[1px] border-[#888888] placeholder:text-[#888888] text-[#111111]"
          }`}
        />

        {action === "deposit" && (
          <select
            value={targetBank}
            onChange={(e) => setTargetBank(e.target.value)}
            className={`w-full p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:border-none focus:ring-indigo-500 ${
              theme
                ? "bg-[#111111] border-[1px] border-[#555555] text-[#eeeeee]"
                : "bg-[#eeeeee] border-[1px] border-[#888888] text-[#111111]"
            }`}
          >
            <option value="">Select bank</option>
            {banks.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

// Spending Modal Component
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
  const [date, setDate] = useState(spending?.date || "");
  const [item, setItem] = useState(spending?.item || "");
  const [cost, setCost] = useState(spending?.cost.toString() || "");
  const { theme } = useTheme();

  const handleSubmit = () => {
    const dateNum = parseInt(date);
    const costNum = parseFloat(cost);

    if (!date || dateNum < 1 || dateNum > 31) {
      alert("❌ Date must be between 1 and 31");
      return;
    }

    if (!item.trim()) {
      alert("❌ Please enter an item");
      return;
    }

    if (isNaN(costNum) || costNum <= 0) {
      alert("❌ Please enter a valid cost");
      return;
    }

    const newSpending: ISpending = { date, item: item.trim(), cost: costNum };

    if (spending) {
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
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md">
      <div
        className={`p-8 rounded-2xl w-full max-w-md ${
          theme ? "bg-black" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-2xl font-bold ${
              theme ? "text-[#ffffff]" : "text-[#000000]"
            }`}
          >
            {spending ? "Edit Spending" : "Add Spending"}
          </h3>
          <button
            onClick={onClose}
            className="bg-red-600 text-white hover:bg-red-700 p-1 rounded-md"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label
              className={`block text-sm mb-2 ${
                theme ? "text-[#cccccc]" : "text-[#444444]"
              }`}
            >
              Date (1-31)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:border-none focus:ring-indigo-500 ${
                theme
                  ? "bg-[#111111] border-[1px] border-[#555555] text-[#eeeeee]"
                  : "bg-[#eeeeee] border-[1px] border-[#888888] text-[#111111]"
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-sm mb-2 ${
                theme ? "text-[#cccccc]" : "text-[#444444]"
              }`}
            >
              Item
            </label>
            <input
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:border-none focus:ring-indigo-500 ${
                theme
                  ? "bg-[#111111] border-[1px] border-[#555555] text-[#eeeeee]"
                  : "bg-[#eeeeee] border-[1px] border-[#888888] text-[#111111]"
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-sm mb-2 ${
                theme ? "text-[#cccccc]" : "text-[#444444]"
              }`}
            >
              Cost (৳)
            </label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:border-none focus:ring-indigo-500 ${
                theme
                  ? "bg-[#111111] border-[1px] border-[#555555] text-[#eeeeee]"
                  : "bg-[#eeeeee] border-[1px] border-[#888888] text-[#111111]"
              }`}
            />
          </div>
        </div>

        <div className="flex gap-3">
          {spending && (
            <button
              onClick={() => {
                if (confirm("Delete this spending?")) {
                  onDelete(monthName, spending);
                  onClose();
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            {spending ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Month Modal
function AddMonthModal({
  isOpen,
  onClose,
  months,
  onAddMonth,
}: {
  isOpen: boolean;
  onClose: () => void;
  months: IMonth[];
  onAddMonth: (monthName: string) => void;
}) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  let content;

  if (months.length === 0) {
    // No months: offer to create current month
    const now = new Date();
    const currentMonthName = now.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    content = (
      <div className="text-center py-8">
        <p
          className={`text-lg mb-8 ${
            theme ? "text-[#cccccc]" : "text-[#444444]"
          }`}
        >
          No months yet. Create the current month to start tracking?
        </p>
        <button
          onClick={() => {
            onAddMonth(currentMonthName);
            onClose();
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Create {currentMonthName}
        </button>
      </div>
    );
  } else {
    // Existing months: offer previous and next
    const sortedMonths = [...months].sort((a, b) =>
      new Date(a.name + " 1").getTime() > new Date(b.name + " 1").getTime()
        ? 1
        : -1,
    );

    const earliest = sortedMonths[0];
    const latest = sortedMonths[sortedMonths.length - 1];

    const earliestDate = new Date(earliest.name + " 1");
    const latestDate = new Date(latest.name + " 1");

    const prevMonthDate = new Date(earliestDate);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthName = prevMonthDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    const nextMonthDate = new Date(latestDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonthName = nextMonthDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    content = (
      <div className="space-y-4">
        <p
          className={`text-center text-lg mb-6 ${
            theme ? "text-[#cccccc]" : "text-[#444444]"
          }`}
        >
          Choose which month to add:
        </p>

        <button
          onClick={() => {
            onAddMonth(prevMonthName);
            onClose();
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition-colors"
        >
          ← Add Previous Month
          <div className="text-sm font-normal mt-1 opacity-90">
            {prevMonthName}
          </div>
        </button>

        <button
          onClick={() => {
            onAddMonth(nextMonthName);
            onClose();
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-lg font-semibold transition-colors"
        >
          Add Next Month →
          <div className="text-sm font-normal mt-1 opacity-90">
            {nextMonthName}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md">
      <div
        className={`p-8 rounded-2xl w-full max-w-md ${
          theme ? "bg-black" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-2xl font-bold ${
              theme ? "text-[#ffffff]" : "text-[#000000]"
            }`}
          >
            Add New Month
          </h3>
          <button
            onClick={onClose}
            className="bg-red-600 text-white hover:bg-red-700 p-1 rounded-md"
          >
            <X size={24} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}
