"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { updateMoney } from "@/app/actions";
import EmailNotVerified from "./EmailNotVerified";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  MinusCircle,
  Pencil,
  Wallet,
  Calendar,
  Receipt,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UNCATEGORIZED = "Uncategorized";
const CASH_SOURCE = "Cash";
const DEFAULT_INCOME_SOURCE = "Dad";

type SpendingItemEntry = { cost: number; category: string; source: string };

// Accepts both the legacy `{ itemName: cost }` shape and the current
// `{ itemName: { cost, category, source } }` shape, normalizing either into
// the latter. Older entries had no `source` — they were always paid from
// cash, so that's the normalized default.
function parseItem(item: string): Record<string, SpendingItemEntry> {
  try {
    const parsed = JSON.parse(item);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      throw new Error("Invalid format");
    const result: Record<string, SpendingItemEntry> = {};
    for (const [name, value] of Object.entries(parsed)) {
      if (typeof value === "number") {
        result[name] = { cost: value, category: UNCATEGORIZED, source: CASH_SOURCE };
      } else if (value && typeof value === "object" && "cost" in value) {
        const v = value as { cost: unknown; category?: unknown; source?: unknown };
        result[name] = {
          cost: Number(v.cost) || 0,
          category:
            typeof v.category === "string" && v.category
              ? v.category
              : UNCATEGORIZED,
          source:
            typeof v.source === "string" && v.source ? v.source : CASH_SOURCE,
        };
      }
    }
    return result;
  } catch {
    return { [item]: { cost: 0, category: UNCATEGORIZED, source: CASH_SOURCE } };
  }
}

function itemKey(spending: ISpending, subName: string): string {
  return `${spending.date}-${spending.item}-${subName}`;
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

function tk(theme: boolean) {
  // Values come from DESIGN.md (NerdWallet): spruce green, mint ladder, hairlines.
  return {
    bg: theme ? "#f7f7f7" : "#0c1210",
    surface: theme ? "#ffffff" : "#121c18",
    surfaceAlt: theme ? "#effcf8" : "#16261f",
    border: theme ? "#ebebec" : "#1f2a26",
    borderStrong: theme ? "#d8d9da" : "#2c3a35",
    text: theme ? "#000000" : "#f4f7f5",
    textSub: theme ? "#3d4045" : "#c3cbc7",
    textMuted: theme ? "#64666a" : "#8f9b96",
    accent: "#008254", // fills (white text on top)
    accentText: theme ? "#008254" : "#3dd89b", // green used as text
    accentHover: "#006642",
    accentSoft: theme ? "#e3faf2" : "#142a22",
    danger: theme ? "#de2828" : "#ef5350",
    success: "#008254",
    warning: theme ? "#b45309" : "#d97706",
    inputBg: theme ? "#ffffff" : "#121c18",
    shadow: "none",
    shadowMd:
      "0 4px 16px rgba(100,102,106,0.05), 0 16px 40px rgba(100,102,104,0.05)",
  };
}

// ─── Mobile Tab Type ──────────────────────────────────────────────────────────
type MobileTab = "accounts" | "timeline" | "spendings";

// ─── Category Pills ────────────────────────────────────────────────────────────

function CategoryPills({
  categories,
  spendings,
  categoriesInUse,
  selectedItemKeys,
  onToggle,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  t,
}: {
  categories: string[];
  spendings: ISpending[];
  categoriesInUse: Set<string>;
  selectedItemKeys: Set<string>;
  onToggle: (category: string) => void;
  onAddCategory: (name: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (name: string) => void;
  t: ReturnType<typeof tk>;
}) {
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const allEntries = spendings.flatMap((sp) =>
    Object.entries(parseItem(sp.item)).map(([subName, entry]) => ({
      key: itemKey(sp, subName),
      category: entry.category,
    })),
  );

  const pillState = (cat: string): "all" | "some" | "none" => {
    const relevant =
      cat === "All" ? allEntries : allEntries.filter((e) => e.category === cat);
    if (relevant.length === 0) return "none";
    const selectedCount = relevant.filter((e) =>
      selectedItemKeys.has(e.key),
    ).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === relevant.length) return "all";
    return "some";
  };

  const commitNewCategory = () => {
    if (newCat.trim()) onAddCategory(newCat.trim());
    setNewCat("");
    setAdding(false);
  };

  const commitRename = () => {
    if (editingCategory && editValue.trim()) {
      onRenameCategory(editingCategory, editValue.trim());
    }
    setEditingCategory(null);
    setEditValue("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {["All", ...categories].map((cat) => {
        const editable = cat !== "All" && cat !== UNCATEGORIZED;

        if (editingCategory === cat) {
          return (
            <input
              key={cat}
              autoFocus
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                else if (e.key === "Escape") {
                  setEditingCategory(null);
                  setEditValue("");
                }
              }}
              onBlur={commitRename}
              className="w-32 px-2.5 py-1.5 rounded-sm text-xs outline-none"
              style={{
                background: t.inputBg,
                border: `1px solid ${t.accent}`,
                color: t.text,
              }}
            />
          );
        }

        const state = pillState(cat);
        const usedElsewhere = categoriesInUse.has(cat);
        return (
          <div
            key={cat}
            className="flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-sm text-xs font-semibold transition-all"
            style={{
              background: state === "none" ? t.surfaceAlt : t.accentSoft,
              color: state === "none" ? t.textMuted : t.accent,
              border: `1px solid ${state === "none" ? t.border : t.accent}`,
            }}
          >
            <button
              onClick={() => onToggle(cat)}
              className="flex items-center gap-1.5"
            >
              {state === "all" ? (
                <CheckCircle2 size={12} />
              ) : state === "some" ? (
                <MinusCircle size={12} />
              ) : (
                <Circle size={12} />
              )}
              {cat}
            </button>
            {editable && (
              <>
                <button
                  onClick={() => {
                    setEditingCategory(cat);
                    setEditValue(cat);
                  }}
                  className="p-0.5 rounded transition-colors"
                  style={{ color: "inherit", opacity: 0.6 }}
                  title="Rename category"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={() => {
                    if (usedElsewhere) {
                      alert(
                        "❌ This category is still assigned to one or more items — reassign or remove them first",
                      );
                      return;
                    }
                    if (confirm(`Delete category "${cat}"?`))
                      onDeleteCategory(cat);
                  }}
                  className="p-0.5 rounded transition-colors disabled:cursor-not-allowed"
                  style={{ color: "inherit", opacity: usedElsewhere ? 0.3 : 0.6 }}
                  title={
                    usedElsewhere
                      ? "Can't delete — still used by an item"
                      : "Delete category"
                  }
                >
                  <X size={11} />
                </button>
              </>
            )}
          </div>
        );
      })}
      {adding ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            type="text"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitNewCategory();
              else if (e.key === "Escape") {
                setNewCat("");
                setAdding(false);
              }
            }}
            onBlur={commitNewCategory}
            placeholder="Category name"
            className="w-32 px-2.5 py-1.5 rounded-sm text-xs outline-none"
            style={{
              background: t.inputBg,
              border: `1px solid ${t.border}`,
              color: t.text,
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-semibold transition-all"
          style={{
            background: "transparent",
            color: t.accentText,
            border: `1px dashed ${t.accent}`,
          }}
        >
          <Plus size={12} /> Category
        </button>
      )}
    </div>
  );
}

// ─── Spendings Table (spreadsheet-style) ──────────────────────────────────────

function EditableSpendingRow({
  spending,
  existingDates,
  categories,
  sources,
  onSave,
  onDelete,
  onCancel,
  t,
}: {
  spending: ISpending;
  existingDates: string[];
  categories: string[];
  sources: string[];
  onSave: (updated: ISpending) => void;
  onDelete: () => void;
  onCancel: () => void;
  t: ReturnType<typeof tk>;
}) {
  const [date, setDate] = useState(spending.date);
  const [items, setItems] = useState<
    { subName: string; subCost: number; category: string; source: string }[]
  >(() =>
    Object.entries(parseItem(spending.item)).map(([n, e]) => ({
      subName: n,
      subCost: e.cost,
      category: e.category,
      source: e.source,
    })),
  );
  const [error, setError] = useState("");

  const total = items.reduce((s, x) => s + x.subCost, 0);

  const handleSave = () => {
    const dateNum = parseInt(date);
    if (!date || dateNum < 1 || dateNum > 31) {
      setError("Date must be between 1 and 31");
      return;
    }
    if (date !== spending.date && existingDates.includes(date)) {
      setError("A spending already exists for this date");
      return;
    }
    if (items.some((s) => !s.subName.trim() || s.subCost <= 0)) {
      setError("All items must have a name and positive cost");
      return;
    }
    const names = items.map((s) => s.subName.trim());
    if (new Set(names).size !== names.length) {
      setError("Item names must be unique");
      return;
    }
    if (total <= 0) {
      setError("Total cost must be positive");
      return;
    }
    const itemObj: Record<string, SpendingItemEntry> = {};
    items.forEach((s) => {
      itemObj[s.subName.trim()] = {
        cost: s.subCost,
        category: s.category,
        source: s.source,
      };
    });
    onSave({ date, item: JSON.stringify(itemObj), cost: total });
  };

  const inputStyle: React.CSSProperties = {
    background: t.inputBg,
    border: `1px solid ${t.border}`,
    color: t.text,
  };

  return (
    <div
      className="p-4 rounded-lg border"
      style={{ borderColor: t.accent, background: t.surface }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-24">
          <input
            type="number"
            min="1"
            max="31"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setError("");
            }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none font-bold"
            style={{ ...inputStyle, color: t.accentText }}
          />
        </div>
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: t.textMuted }}
        >
          Day
        </span>
      </div>

      <div className="space-y-2 mb-2">
        {items.map((sub, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="text"
              value={sub.subName}
              onChange={(e) => {
                const u = [...items];
                u[i] = { ...u[i], subName: e.target.value };
                setItems(u);
                setError("");
              }}
              placeholder="Item name"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={sub.subCost === 0 ? "" : sub.subCost.toString()}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9.]/g, "");
                const u = [...items];
                u[i] = { ...u[i], subCost: parseFloat(raw) || 0 };
                setItems(u);
                setError("");
              }}
              placeholder="Cost"
              className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
            <select
              value={sub.category}
              onChange={(e) => {
                const u = [...items];
                u[i] = { ...u[i], category: e.target.value };
                setItems(u);
              }}
              className="w-28 px-2 py-2 rounded-lg text-xs outline-none flex-shrink-0"
              style={inputStyle}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={sub.source}
              onChange={(e) => {
                const u = [...items];
                u[i] = { ...u[i], source: e.target.value };
                setItems(u);
              }}
              className="w-24 px-2 py-2 rounded-lg text-xs outline-none flex-shrink-0"
              style={inputStyle}
            >
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => setItems(items.filter((_, j) => j !== i))}
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ background: "#de282820", color: t.danger }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div
            className="text-center py-3 rounded-lg border border-dashed text-xs"
            style={{ borderColor: t.border, color: t.textMuted }}
          >
            No items — add one below
          </div>
        )}
      </div>

      <button
        onClick={() =>
          setItems([
            ...items,
            {
              subName: "",
              subCost: 0,
              category: categories[0] || UNCATEGORIZED,
              source: sources[0] || CASH_SOURCE,
            },
          ])
        }
        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all mb-3"
        style={{ background: t.accentSoft, color: t.accentText }}
      >
        <Plus size={11} /> Add Item
      </button>

      <div
        className="flex items-center justify-between rounded-lg px-4 py-2.5 mb-3"
        style={{ background: t.accentSoft, border: `1px solid ${t.accent}33` }}
      >
        <span className="text-sm font-semibold" style={{ color: t.accentText }}>
          Total
        </span>
        <span className="text-base font-bold" style={{ color: t.accentText }}>
          ৳ {total.toLocaleString()}
        </span>
      </div>

      {error && (
        <p className="text-xs mb-3" style={{ color: t.danger }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => {
            if (confirm("Delete this spending?")) onDelete();
          }}
          className="px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: t.danger }}
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: t.surfaceAlt,
            color: t.textSub,
            border: `1px solid ${t.border}`,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: t.accent, boxShadow: "none" }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function SpendingsTable({
  spendings,
  selectedItemKeys,
  categories,
  sources,
  toggleItem,
  toggleDate,
  onUpdate,
  onDelete,
  totalSpending,
  t,
}: {
  spendings: ISpending[];
  selectedItemKeys: Set<string>;
  categories: string[];
  sources: string[];
  toggleItem: (key: string) => void;
  toggleDate: (
    spending: ISpending,
    entries: [string, SpendingItemEntry][],
  ) => void;
  onUpdate: (old: ISpending, updated: ISpending) => void;
  onDelete: (spending: ISpending) => void;
  totalSpending: number;
  t: ReturnType<typeof tk>;
}) {
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const sorted = [...spendings].sort(
    (a, b) => parseInt(a.date) - parseInt(b.date),
  );

  const headerCell: React.CSSProperties = {
    color: t.textMuted,
    borderBottom: `1px solid ${t.border}`,
  };
  const cell: React.CSSProperties = {
    borderTop: `1px solid ${t.border}`,
  };

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: t.border, background: t.surface }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: t.surfaceAlt }}>
              <th className="w-10 px-3 py-2.5" style={headerCell} />
              <th
                className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                style={headerCell}
              >
                Date
              </th>
              <th className="w-10 px-3 py-2.5" style={headerCell} />
              <th
                className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                style={headerCell}
              >
                Item
              </th>
              <th
                className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                style={headerCell}
              >
                Category
              </th>
              <th
                className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                style={headerCell}
              >
                Cost
              </th>
              <th
                className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                style={headerCell}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((spending, idx) => {
              if (editingDate === spending.date) {
                return (
                  <tr key={`edit-${spending.date}`}>
                    <td colSpan={7} className="p-3" style={cell}>
                      <EditableSpendingRow
                        spending={spending}
                        existingDates={spendings
                          .map((s) => s.date)
                          .filter((d) => d !== spending.date)}
                        categories={categories}
                        sources={sources}
                        onSave={(updated) => {
                          onUpdate(spending, updated);
                          setEditingDate(null);
                        }}
                        onDelete={() => {
                          onDelete(spending);
                          setEditingDate(null);
                        }}
                        onCancel={() => setEditingDate(null)}
                        t={t}
                      />
                    </td>
                  </tr>
                );
              }

              const parsed = parseItem(spending.item);
              const entries = Object.entries(parsed);
              const rowCount = Math.max(entries.length, 1);
              const selectedCount = entries.filter(([subName]) =>
                selectedItemKeys.has(itemKey(spending, subName)),
              ).length;
              const allSelected =
                entries.length > 0 && selectedCount === entries.length;
              const noneSelected = selectedCount === 0;
              const rowBg = idx % 2 === 0 ? t.surface : t.surfaceAlt;
              const selectedTotal = entries
                .filter(([subName]) =>
                  selectedItemKeys.has(itemKey(spending, subName)),
                )
                .reduce((sum, [, entry]) => sum + entry.cost, 0);

              const rows =
                entries.length === 0
                  ? [
                      ["—", { cost: 0, category: "" }] as [
                        string,
                        SpendingItemEntry,
                      ],
                    ]
                  : entries;

              return rows.map(([subName, subEntry], j) => {
                const key = itemKey(spending, subName);
                const isItemChecked = selectedItemKeys.has(key);
                return (
                  <tr
                    key={`${spending.date}-${spending.item}-${j}`}
                    className="cursor-pointer transition-colors"
                    style={{ background: rowBg }}
                    onClick={() => setEditingDate(spending.date)}
                  >
                    {j === 0 && (
                      <>
                        <td
                          rowSpan={rowCount}
                          className="px-3 py-2.5 align-top"
                          style={cell}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDate(spending, entries);
                          }}
                        >
                          {allSelected ? (
                            <CheckCircle2
                              size={16}
                              style={{ color: t.accentText }}
                            />
                          ) : noneSelected ? (
                            <Circle size={16} style={{ color: t.textMuted }} />
                          ) : (
                            <MinusCircle
                              size={16}
                              style={{ color: t.accentText }}
                            />
                          )}
                        </td>
                        <td
                          rowSpan={rowCount}
                          className="px-3 py-2.5 align-top font-bold whitespace-nowrap"
                          style={{ ...cell, color: t.accentText }}
                        >
                          {spending.date}
                        </td>
                      </>
                    )}
                    <td
                      className="px-3 py-2.5"
                      style={{
                        ...cell,
                        opacity: isItemChecked ? 1 : 0.45,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItem(key);
                      }}
                    >
                      {isItemChecked ? (
                        <CheckCircle2 size={16} style={{ color: t.accentText }} />
                      ) : (
                        <Circle size={16} style={{ color: t.textMuted }} />
                      )}
                    </td>
                    <td
                      className="px-3 py-2.5"
                      style={{
                        ...cell,
                        color: t.text,
                        opacity: isItemChecked ? 1 : 0.45,
                      }}
                    >
                      {subName}
                    </td>
                    <td
                      className="px-3 py-2.5 whitespace-nowrap"
                      style={{
                        ...cell,
                        color: t.textSub,
                        opacity: isItemChecked ? 1 : 0.45,
                      }}
                    >
                      {subEntry.category}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right font-semibold whitespace-nowrap"
                      style={{
                        ...cell,
                        color: t.danger,
                        opacity: isItemChecked ? 1 : 0.45,
                      }}
                    >
                      ৳ {subEntry.cost.toLocaleString()}
                    </td>
                    {j === 0 && (
                      <td
                        rowSpan={rowCount}
                        className="px-3 py-2.5 align-top text-right font-bold whitespace-nowrap"
                        style={{
                          ...cell,
                          color: t.danger,
                          opacity: noneSelected ? 0.45 : 1,
                        }}
                      >
                        ৳ {selectedTotal.toLocaleString()}
                      </td>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: t.surfaceAlt }}>
              <td
                colSpan={6}
                className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide"
                style={{ ...cell, color: t.textMuted }}
              >
                Total
              </td>
              <td
                className="px-3 py-2.5 text-right font-bold whitespace-nowrap"
                style={{ ...cell, color: t.danger }}
              >
                ৳ {totalSpending.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Add Spending Panel (inline, above the spreadsheet) ──────────────────────

function AddSpendingPanel({
  spendings,
  categories,
  sources,
  onAdd,
  onUpdate,
  onClose,
  t,
}: {
  spendings: ISpending[];
  categories: string[];
  sources: string[];
  onAdd: (spending: ISpending) => void;
  onUpdate: (old: ISpending, updated: ISpending) => void;
  onClose: () => void;
  t: ReturnType<typeof tk>;
}) {
  const existingDates = spendings.map((s) => s.date);

  const getNextMissingDate = (): string => {
    const used = new Set(
      existingDates
        .map((d) => parseInt(d, 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 31),
    );
    for (let d = 1; d <= 31; d++) if (!used.has(d)) return d.toString();
    return "";
  };

  const todayDate = new Date().getDate().toString();
  const [dateMode, setDateMode] = useState<"next" | "today">("next");
  const [date, setDate] = useState<string>(getNextMissingDate());
  const [itemName, setItemName] = useState("");
  const [itemCost, setItemCost] = useState("");
  const [itemCategory, setItemCategory] = useState(
    categories[0] || UNCATEGORIZED,
  );
  const [itemSource, setItemSource] = useState(sources[0] || CASH_SOURCE);
  const [error, setError] = useState("");

  const handleDateModeChange = (mode: "next" | "today") => {
    setDateMode(mode);
    setDate(mode === "today" ? todayDate : getNextMissingDate());
    setError("");
  };

  const handleSubmit = () => {
    const dateNum = parseInt(date);
    if (!date || dateNum < 1 || dateNum > 31) {
      setError("Date must be between 1 and 31");
      return;
    }
    if (!itemName.trim()) {
      setError("Please enter an item name");
      return;
    }
    const cost = parseFloat(itemCost);
    if (isNaN(cost) || cost <= 0) {
      setError("Please enter a valid cost");
      return;
    }

    const existing = spendings.find((s) => s.date === date);
    if (existing) {
      const parsed = parseItem(existing.item);
      if (itemName.trim() in parsed) {
        setError("An item with this name already exists for this date");
        return;
      }
      const updatedItemObj = {
        ...parsed,
        [itemName.trim()]: { cost, category: itemCategory, source: itemSource },
      };
      const newTotal = Object.values(updatedItemObj).reduce(
        (s, e) => s + e.cost,
        0,
      );
      onUpdate(existing, {
        date,
        item: JSON.stringify(updatedItemObj),
        cost: newTotal,
      });
    } else {
      onAdd({
        date,
        item: JSON.stringify({
          [itemName.trim()]: { cost, category: itemCategory, source: itemSource },
        }),
        cost,
      });
    }

    setItemName("");
    setItemCost("");
    setError("");
  };

  return (
    <div
      className="rounded-lg border p-4 mb-4"
      style={{ borderColor: t.border, background: t.surface, boxShadow: t.shadow }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: t.text }}>
          New Spending
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg transition-colors"
          style={{ color: t.textMuted }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        {(["next", "today"] as const).map((mode) => {
          const active = dateMode === mode;
          const label = mode === "next" ? "Next available date" : "Today";
          return (
            <button
              key={mode}
              type="button"
              onClick={() => handleDateModeChange(mode)}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: active ? t.accentSoft : "transparent",
                color: active ? t.accent : t.textMuted,
                border: `1px solid ${active ? t.accent : t.border}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <StyledInput
          label="Day (1–31)"
          type="number"
          min="1"
          max="31"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setError("");
          }}
        />
        {date && (
          <p className="text-xs mt-1" style={{ color: t.accentText }}>
            ✓ {dateMode === "today" ? "Today" : "Next available date"}
          </p>
        )}
      </div>

      <p
        className="text-xs font-semibold uppercase tracking-wide mb-2"
        style={{ color: t.textMuted }}
      >
        Add your first item
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={itemName}
          onChange={(e) => {
            setItemName(e.target.value);
            setError("");
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
          value={itemCost}
          onChange={(e) => {
            setItemCost(e.target.value.replace(/[^0-9.]/g, ""));
            setError("");
          }}
          placeholder="Cost"
          className="w-24 px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: t.inputBg,
            border: `1px solid ${t.border}`,
            color: t.text,
          }}
        />
        <select
          value={itemCategory}
          onChange={(e) => setItemCategory(e.target.value)}
          className="w-28 px-2 py-2.5 rounded-lg text-xs outline-none flex-shrink-0"
          style={{
            background: t.inputBg,
            border: `1px solid ${t.border}`,
            color: t.text,
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={itemSource}
          onChange={(e) => setItemSource(e.target.value)}
          className="w-24 px-2 py-2.5 rounded-lg text-xs outline-none flex-shrink-0"
          style={{
            background: t.inputBg,
            border: `1px solid ${t.border}`,
            color: t.text,
          }}
        >
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-xs mt-2" style={{ color: t.danger }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        className="w-full mt-3 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
        style={{ background: t.accent, boxShadow: "none" }}
      >
        Add Spending
      </button>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashBoard() {
  const { theme } = useTheme();
  const t = tk(theme);
  const [hasMounted, setHasMounted] = useState(false);
  const { user: auth, setAuth, hydrated } = useAuth();
  const router = useRouter();

  const [banks, setBanks] = useState<IBank[]>([]);
  const [inCash, setInCash] = useState<number>(0);
  const [months, setMonths] = useState<IMonth[]>([]);
  const [categories, setCategories] = useState<string[]>([UNCATEGORIZED]);
  const [income, setIncome] = useState<IIncome[]>([]);
  const [incomeSources, setIncomeSources] = useState<string[]>([DEFAULT_INCOME_SOURCE]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [monthSearch, setMonthSearch] = useState("");
  const [originalMoney, setOriginalMoney] = useState<IMoney | null>(null);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [addSpendingOpen, setAddSpendingOpen] = useState(false);
  const desktopSpendingsScrollRef = useRef<HTMLDivElement>(null);
  const mobileSpendingsScrollRef = useRef<HTMLDivElement>(null);
  const [selectedItemKeys, setSelectedItemKeys] = useState<Set<string>>(
    new Set(),
  );
  const [mobileTab, setMobileTab] = useState<MobileTab>("accounts");

  const [bankModal, setBankModal] = useState<{
    show: boolean;
    bank: IBank | null;
  }>({ show: false, bank: null });
  const [cashModal, setCashModal] = useState(false);
  const [addMonthModalOpen, setAddMonthModalOpen] = useState(false);
  const [totalBalanceModalOpen, setTotalBalanceModalOpen] = useState(false);

  const selectedMonthData = months.find((m) => m.name === selectedMonth);
  const sources = [CASH_SOURCE, ...banks.map((b) => b.name)];
  const totalSpending =
    selectedMonthData?.spendings.reduce((sum, s) => {
      const parsed = parseItem(s.item);
      return (
        sum +
        Object.entries(parsed).reduce(
          (subSum, [subName, entry]) =>
            selectedItemKeys.has(itemKey(s, subName))
              ? subSum + entry.cost
              : subSum,
          0,
        )
      );
    }, 0) || 0;

  useEffect(() => {
    if (selectedMonthData) {
      setSelectedItemKeys(
        new Set(
          selectedMonthData.spendings.flatMap((s) =>
            Object.keys(parseItem(s.item)).map((subName) =>
              itemKey(s, subName),
            ),
          ),
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedMonthData?.spendings.length]);

  useEffect(() => {
    setAddSpendingOpen(false);
  }, [selectedMonth]);

  useEffect(() => {
    if (addSpendingOpen) {
      desktopSpendingsScrollRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      mobileSpendingsScrollRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [addSpendingOpen]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Runs ONCE when auth first loads — never again
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!hasMounted || !hydrated) return;
    if (auth === null) {
      router.push("/login");
    } else if (auth?.money && !initialized) {
      const loadedCategories =
        auth.money.categories && auth.money.categories.length > 0
          ? auth.money.categories
          : [UNCATEGORIZED];
      setBanks(auth.money.banks || []);
      setInCash(auth.money.inCash || 0);
      setMonths(auth.money.Months || []);
      setCategories(loadedCategories);
      setOriginalMoney({ ...auth.money, categories: loadedCategories });
      setSelectedBanks(auth.money.banks?.map((b) => b.name) || []);
      setIncome(auth.income || []);
      setIncomeSources(
        auth.incomeSources && auth.incomeSources.length > 0
          ? auth.incomeSources
          : [DEFAULT_INCOME_SOURCE],
      );
      setInitialized(true);
    }
  }, [auth, hasMounted, hydrated, router, initialized]);

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

const handleIncomeUpdate = (amount: number, source: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString("default", { month: "long" });
    setIncome((prev) => {
      const existing = prev.find(
        (i) => i.year === year && i.month === month && i.source === source,
      );
      if (existing) {
        return prev.map((i) =>
          i.year === year && i.month === month && i.source === source
            ? { ...i, amount: i.amount + amount }
            : i
        );
      }
      return [...prev, { year, month, amount, source }];
    });
  };

const handleSave = async () => {
    if (!auth?.email) return;
    setIsSaving(true);
    try {
      const updatedMoney: IMoney = { banks, inCash, Months: months, categories };
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

  const handleBankDeposit = (bankName: string, amount: number, source: string) => {
    setBanks(banks.map((b) =>
      b.name === bankName ? { ...b, amount: b.amount + amount } : b
    ));
    handleIncomeUpdate(amount, source);
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

  const handleEarnCash = (amount: number, source: string) => {
    setInCash(inCash + amount);
    handleIncomeUpdate(amount, source);
  };

  const handleAddMonth = (monthName: string) => {
    if (months.some((m) => m.name === monthName)) {
      alert("❌ This month already exists");
      return;
    }
    setMonths([...months, { name: monthName, spendings: [] }]);
  };

  // Computes, per money source, the net amount that would be spent (positive)
  // or restored (negative) moving from oldItems to newItems.
  const computeMoneyDeltas = (
    oldItems: Record<string, SpendingItemEntry>,
    newItems: Record<string, SpendingItemEntry>,
  ): Map<string, number> => {
    const deltas = new Map<string, number>();
    const bump = (source: string, amount: number) =>
      deltas.set(source, (deltas.get(source) || 0) + amount);

    const allNames = new Set([
      ...Object.keys(oldItems),
      ...Object.keys(newItems),
    ]);
    allNames.forEach((name) => {
      const oldEntry = oldItems[name];
      const newEntry = newItems[name];
      if (oldEntry && newEntry) {
        if (oldEntry.source === newEntry.source) {
          bump(newEntry.source, newEntry.cost - oldEntry.cost);
        } else {
          bump(oldEntry.source, -oldEntry.cost);
          bump(newEntry.source, newEntry.cost);
        }
      } else if (newEntry) {
        bump(newEntry.source, newEntry.cost);
      } else if (oldEntry) {
        bump(oldEntry.source, -oldEntry.cost);
      }
    });
    return deltas;
  };

  const getSourceBalance = (source: string): number =>
    source === CASH_SOURCE
      ? inCash
      : banks.find((b) => b.name === source)?.amount ?? 0;

  // Validates every positive delta (money being spent) against its source's
  // current balance, then applies all deltas at once. Returns false (with an
  // alert) and applies nothing if any source would go negative.
  const applyMoneyDeltas = (deltas: Map<string, number>): boolean => {
    for (const [source, delta] of deltas) {
      if (delta > 0 && getSourceBalance(source) < delta) {
        alert(`❌ Insufficient balance in ${source}`);
        return false;
      }
    }
    let nextInCash = inCash;
    let nextBanks = banks;
    deltas.forEach((delta, source) => {
      if (delta === 0) return;
      if (source === CASH_SOURCE) {
        nextInCash -= delta;
      } else {
        nextBanks = nextBanks.map((b) =>
          b.name === source ? { ...b, amount: b.amount - delta } : b,
        );
      }
    });
    setInCash(nextInCash);
    setBanks(nextBanks);
    return true;
  };

  const handleAddSpending = (monthName: string, spending: ISpending) => {
    const month = months.find((m) => m.name === monthName);
    if (month && month.spendings.some((s) => s.date === spending.date)) {
      alert("❌ A spending already exists for this date in this month");
      return;
    }
    const deltas = computeMoneyDeltas({}, parseItem(spending.item));
    if (!applyMoneyDeltas(deltas)) return;
    setMonths(
      months.map((m) =>
        m.name === monthName
          ? { ...m, spendings: [...m.spendings, spending] }
          : m,
      ),
    );
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
    const deltas = computeMoneyDeltas(
      parseItem(oldSpending.item),
      parseItem(newSpending.item),
    );
    if (!applyMoneyDeltas(deltas)) return;
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
  };

  const handleDeleteSpending = (monthName: string, spending: ISpending) => {
    const deltas = computeMoneyDeltas(parseItem(spending.item), {});
    applyMoneyDeltas(deltas);
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
  };

  const handleAddCategory = (name: string) => {
    if (categories.includes(name)) return;
    setCategories([...categories, name]);
  };

  const categoriesInUse = new Set(
    months.flatMap((m) =>
      m.spendings.flatMap((s) =>
        Object.values(parseItem(s.item)).map((entry) => entry.category),
      ),
    ),
  );

  const handleRenameCategory = (oldName: string, newName: string) => {
    if (newName === oldName) return;
    if (newName === "All" || newName === UNCATEGORIZED) {
      alert(`❌ "${newName}" is a reserved category name`);
      return;
    }
    if (categories.includes(newName)) {
      alert("❌ A category with this name already exists");
      return;
    }
    setCategories(categories.map((c) => (c === oldName ? newName : c)));
    setMonths(
      months.map((m) => ({
        ...m,
        spendings: m.spendings.map((s) => {
          const parsed = parseItem(s.item);
          let changed = false;
          const updated: Record<string, SpendingItemEntry> = {};
          for (const [name, entry] of Object.entries(parsed)) {
            if (entry.category === oldName) {
              updated[name] = { ...entry, category: newName };
              changed = true;
            } else {
              updated[name] = entry;
            }
          }
          return changed ? { ...s, item: JSON.stringify(updated) } : s;
        }),
      })),
    );
  };

  const handleDeleteCategory = (name: string) => {
    if (categoriesInUse.has(name)) {
      alert(
        "❌ This category is still assigned to one or more items — reassign or remove them first",
      );
      return;
    }
    setCategories(categories.filter((c) => c !== name));
  };

  const toggleCategory = (category: string) => {
    if (!selectedMonthData) return;
    const keys = selectedMonthData.spendings.flatMap((s) =>
      Object.entries(parseItem(s.item))
        .filter(([, entry]) => category === "All" || entry.category === category)
        .map(([subName]) => itemKey(s, subName)),
    );
    if (keys.length === 0) return;
    const allSelected = keys.every((k) => selectedItemKeys.has(k));
    const newSet = new Set(selectedItemKeys);
    if (allSelected) keys.forEach((k) => newSet.delete(k));
    else keys.forEach((k) => newSet.add(k));
    setSelectedItemKeys(newSet);
  };

  const hasUnsavedChanges = () => {
    if (!originalMoney) return false;
    const moneyChanged =
      JSON.stringify({ banks, inCash, Months: months, categories }) !==
      JSON.stringify(originalMoney);
    const incomeChanged =
      JSON.stringify(income) !== JSON.stringify(auth?.income || []);
    return moneyChanged || incomeChanged;
  };

  const handleRenameBank = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      alert("❌ Bank name cannot be empty");
      return;
    }
    if (banks.some((b) => b.name === trimmed && b.name !== oldName)) {
      alert("❌ A bank with this name already exists");
      return;
    }
    setBanks(
      banks.map((b) => (b.name === oldName ? { ...b, name: trimmed } : b)),
    );
    setMonths(
      months.map((m) => ({
        ...m,
        spendings: m.spendings.map((s) => {
          const parsed = parseItem(s.item);
          let changed = false;
          const updated: Record<string, SpendingItemEntry> = {};
          for (const [name, entry] of Object.entries(parsed)) {
            if (entry.source === oldName) {
              updated[name] = { ...entry, source: trimmed };
              changed = true;
            } else {
              updated[name] = entry;
            }
          }
          return changed ? { ...s, item: JSON.stringify(updated) } : s;
        }),
      })),
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
          className="cursor-pointer rounded-lg p-4 transition-all hover:brightness-110"
          style={{
            background: "#00482f",
          }}
        >
          <div className="text-xs font-medium text-white/75 mb-1">
            Total Balance
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ৳ {totalBalance.toLocaleString()}
          </div>
          <div className="text-xs text-white/75 mt-1">
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
            className="w-full pl-8 pr-3 py-2 text-sm rounded-none outline-none transition-all"
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
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-dashed transition-all hover:border-primary hover:text-brand group"
          style={{ borderColor: t.borderStrong, color: t.textMuted }}
        >
          <Plus
            size={14}
            className="group-hover:text-brand transition-colors"
          />
          Add Bank Account
        </button>

        {/* Bank cards */}
        {filteredBanks.map((bank) => (
          <div
            key={bank.name}
            onClick={() => setBankModal({ show: true, bank })}
            className="rounded-lg p-3.5 cursor-pointer transition-all hover:brightness-110 group"
            style={{
              background: "#006642",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/75 mb-0.5">Bank</div>
                <div className="text-sm font-semibold text-white truncate">
                  {bank.name}
                </div>
                <div className="text-lg font-bold text-white mt-1">
                  ৳ {bank.amount.toLocaleString()}
                </div>
              </div>
              <Pencil
                size={12}
                className="text-white/75 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0"
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
          className="rounded-lg p-3.5 cursor-pointer transition-all hover:brightness-110 group"
          style={{
            background: "#008254",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-white/75 mb-0.5">Available</div>
              <div className="text-sm font-semibold text-white">Cash</div>
              <div className="text-lg font-bold text-white mt-1">
                ৳ {inCash.toLocaleString()}
              </div>
            </div>
            <Pencil
              size={12}
              className="text-white/75 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
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
            className="w-full pl-8 pr-3 py-2 text-sm rounded-none outline-none"
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
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-dashed transition-all hover:border-primary hover:text-brand group"
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
              className="relative group rounded-lg px-3 py-3 cursor-pointer transition-all"
              style={
                isSelected
                  ? {
                      background: t.accent,
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
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: "#de2828",
              }}
            >
              <div>
                <div className="text-xs text-error leading-none">Total</div>
                <div className="text-sm font-bold text-white">
                  ৳ {totalSpending.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              onClick={() => setAddSpendingOpen((v) => !v)}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white transition-all active:scale-[0.98]"
              style={{
                background: t.accent,
              }}
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Spending list */}
      {selectedMonthData ? (
        <div
          ref={mobileSpendingsScrollRef}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {addSpendingOpen && (
            <AddSpendingPanel
              spendings={selectedMonthData.spendings}
              categories={categories}
              sources={sources}
              onAdd={(spending) => handleAddSpending(selectedMonth!, spending)}
              onUpdate={(old, updated) =>
                handleUpdateSpending(selectedMonth!, old, updated)
              }
              onClose={() => setAddSpendingOpen(false)}
              t={t}
            />
          )}
          <CategoryPills
            categories={categories}
            spendings={selectedMonthData.spendings}
            categoriesInUse={categoriesInUse}
            selectedItemKeys={selectedItemKeys}
            onToggle={toggleCategory}
            onAddCategory={handleAddCategory}
            onRenameCategory={handleRenameCategory}
            onDeleteCategory={handleDeleteCategory}
            t={t}
          />
          {selectedMonthData.spendings.length === 0 ? (
            !addSpendingOpen && (
              <div
                className="flex flex-col items-center justify-center h-full gap-3"
                style={{ color: t.textMuted }}
              >
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center"
                  style={{ background: t.surfaceAlt }}
                >
                  <Plus size={28} style={{ color: t.textMuted }} />
                </div>
                <p className="text-sm font-medium">No spendings yet</p>
                <p className="text-xs">Tap &quot;+&quot; to add a spending</p>
              </div>
            )
          ) : (
            <SpendingsTable
              spendings={selectedMonthData.spendings}
              selectedItemKeys={selectedItemKeys}
              categories={categories}
              sources={sources}
              toggleItem={(key) => {
                const newSet = new Set(selectedItemKeys);
                if (newSet.has(key)) newSet.delete(key);
                else newSet.add(key);
                setSelectedItemKeys(newSet);
              }}
              toggleDate={(spending, entries) => {
                const keys = entries.map(([subName]) =>
                  itemKey(spending, subName),
                );
                const allSelected = keys.every((k) => selectedItemKeys.has(k));
                const newSet = new Set(selectedItemKeys);
                if (allSelected) keys.forEach((k) => newSet.delete(k));
                else keys.forEach((k) => newSet.add(k));
                setSelectedItemKeys(newSet);
              }}
              onUpdate={(old, updated) =>
                handleUpdateSpending(selectedMonth!, old, updated)
              }
              onDelete={(spending) =>
                handleDeleteSpending(selectedMonth!, spending)
              }
              totalSpending={totalSpending}
              t={t}
            />
          )}
        </div>
      ) : (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-4 px-4"
          style={{ color: t.textMuted }}
        >
          <div
            className="w-20 h-20 rounded-lg flex items-center justify-center"
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
        className="hidden lg:flex h-[calc(100dvh-64px)] w-full overflow-hidden"
        style={{
          background: t.bg,
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
                style={{ background: t.accentSoft, color: t.accentText }}
              >
                <BarChart2 size={13} />
                Stats
              </button>
            </div>
            <div
              onClick={() => setTotalBalanceModalOpen(true)}
              className="cursor-pointer rounded-lg p-4 transition-all hover:brightness-110"
              style={{
                background: "#00482f",
              }}
            >
              <div className="text-xs font-medium text-white/75 mb-1">
                Total Balance
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                ৳ {totalBalance.toLocaleString()}
              </div>
              <div className="text-xs text-white/75 mt-1">
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
                className="w-full pl-8 pr-3 py-2 text-sm rounded-none outline-none transition-all"
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
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-dashed transition-all hover:border-primary hover:text-brand group"
              style={{ borderColor: t.borderStrong, color: t.textMuted }}
            >
              <Plus
                size={14}
                className="group-hover:text-brand transition-colors"
              />
              Add Bank Account
            </button>
            {filteredBanks.map((bank) => (
              <div
                key={bank.name}
                onClick={() => setBankModal({ show: true, bank })}
                className="rounded-lg p-3.5 cursor-pointer transition-all hover:brightness-110 group"
                style={{
                  background:
                    "#006642",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/75 mb-0.5">Bank</div>
                    <div className="text-sm font-semibold text-white truncate">
                      {bank.name}
                    </div>
                    <div className="text-lg font-bold text-white mt-1">
                      ৳ {bank.amount.toLocaleString()}
                    </div>
                  </div>
                  <Pencil
                    size={12}
                    className="text-white/75 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0"
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
              className="rounded-lg p-3.5 cursor-pointer transition-all hover:brightness-110 group"
              style={{
                background: "#008254",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-white/75 mb-0.5">
                    Available
                  </div>
                  <div className="text-sm font-semibold text-white">Cash</div>
                  <div className="text-lg font-bold text-white mt-1">
                    ৳ {inCash.toLocaleString()}
                  </div>
                </div>
                <Pencil
                  size={12}
                  className="text-white/75 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
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
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-none outline-none"
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
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-dashed transition-all hover:border-primary hover:text-brand group"
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
                  className="relative group rounded-lg px-3 py-3 cursor-pointer transition-all"
                  style={
                    isSelected
                      ? {
                          background: t.accent,
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
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
                  style={{
                    background: "#de2828",
                  }}
                >
                  <div>
                    <div className="text-xs text-error">Month Total</div>
                    <div className="text-lg font-bold text-white">
                      ৳ {totalSpending.toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setAddSpendingOpen((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{
                    background: t.accent,
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
              ref={desktopSpendingsScrollRef}
              className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin"
              style={{ scrollbarColor: `${t.borderStrong} transparent` }}
            >
              {addSpendingOpen && (
                <AddSpendingPanel
                  spendings={selectedMonthData.spendings}
                  categories={categories}
                  sources={sources}
                  onAdd={(spending) =>
                    handleAddSpending(selectedMonth!, spending)
                  }
                  onUpdate={(old, updated) =>
                    handleUpdateSpending(selectedMonth!, old, updated)
                  }
                  onClose={() => setAddSpendingOpen(false)}
                  t={t}
                />
              )}
              <CategoryPills
                categories={categories}
                spendings={selectedMonthData.spendings}
                categoriesInUse={categoriesInUse}
                selectedItemKeys={selectedItemKeys}
                onToggle={toggleCategory}
                onAddCategory={handleAddCategory}
                onRenameCategory={handleRenameCategory}
                onDeleteCategory={handleDeleteCategory}
                t={t}
              />
              {selectedMonthData.spendings.length === 0 ? (
                !addSpendingOpen && (
                  <div
                    className="flex flex-col items-center justify-center h-full gap-3"
                    style={{ color: t.textMuted }}
                  >
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center"
                      style={{ background: t.surfaceAlt }}
                    >
                      <Plus size={28} style={{ color: t.textMuted }} />
                    </div>
                    <p className="text-sm font-medium">No spendings yet</p>
                    <p className="text-xs">
                      Click &quot;Add Spending&quot; to get started
                    </p>
                  </div>
                )
              ) : (
                <SpendingsTable
                  spendings={selectedMonthData.spendings}
                  selectedItemKeys={selectedItemKeys}
                  categories={categories}
                  sources={sources}
                  toggleItem={(key) => {
                    const newSet = new Set(selectedItemKeys);
                    if (newSet.has(key)) newSet.delete(key);
                    else newSet.add(key);
                    setSelectedItemKeys(newSet);
                  }}
                  toggleDate={(spending, entries) => {
                    const keys = entries.map(([subName]) =>
                      itemKey(spending, subName),
                    );
                    const allSelected = keys.every((k) =>
                      selectedItemKeys.has(k),
                    );
                    const newSet = new Set(selectedItemKeys);
                    if (allSelected) keys.forEach((k) => newSet.delete(k));
                    else keys.forEach((k) => newSet.add(k));
                    setSelectedItemKeys(newSet);
                  }}
                  onUpdate={(old, updated) =>
                    handleUpdateSpending(selectedMonth!, old, updated)
                  }
                  onDelete={(spending) =>
                    handleDeleteSpending(selectedMonth!, spending)
                  }
                  totalSpending={totalSpending}
                  t={t}
                />
              )}
            </div>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-4"
              style={{ color: t.textMuted }}
            >
              <div
                className="w-20 h-20 rounded-lg flex items-center justify-center"
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
          height: "calc(100dvh - 64px)",
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
                style={{ background: t.accentSoft, color: t.accentText }}
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
                style={{ color: isActive ? t.accentText : t.textMuted }}
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
          incomeSources={incomeSources}
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
          incomeSources={incomeSources}
          onClose={() => setCashModal(false)}
          onDeposit={handleCashDeposit}
          onUpdateCash={setInCash}
          onEarnCash={handleEarnCash}
        />
      )}

      <AddMonthModal
        isOpen={addMonthModalOpen}
        onClose={() => setAddMonthModalOpen(false)}
        months={months}
        onAddMonth={handleAddMonth}
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
        className={`w-full ${width} rounded-t-xl sm:rounded-lg overflow-hidden`}
        style={{
          background: t.surface,
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.08)",
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
        className="w-full px-3.5 py-2.5 rounded-none text-sm outline-none transition-all"
        style={{
          background: t.inputBg,
          border: `1px solid ${t.border}`,
          color: t.text,
          ...props.style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#008254";
          e.currentTarget.style.boxShadow = "0 0 0 1px #008254";
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
        className="w-full px-3.5 py-2.5 rounded-none text-sm outline-none transition-all"
        style={{
          background: t.inputBg,
          border: `1px solid ${t.border}`,
          color: t.text,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#008254";
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
  color = "#008254",
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
      className="flex-1 py-2 rounded-sm text-sm font-bold transition-all"
      style={
        active
          ? {
              background: color,
              color: "#fff",
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
  color = "#008254",
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
      className="w-full py-3 rounded-sm text-sm font-bold uppercase tracking-wide text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
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
      className="rounded-lg p-4"
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
  incomeSources,
  onClose,
  onDeposit,
  onWithdraw,
  onTransfer,
  onRename,
}: {
  bank: IBank;
  banks: IBank[];
  incomeSources: string[];
  onClose: () => void;
  onDeposit: (name: string, amount: number, source: string) => void;
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
  const [incomeSource, setIncomeSource] = useState(
    incomeSources[0] || DEFAULT_INCOME_SOURCE,
  );

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
    if (action === "deposit") onDeposit(bank.name, amt, incomeSource);
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
    transfer: "#006642",
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
            {action === "deposit" && (
              <StyledSelect
                label="Income Source"
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value)}
              >
                {incomeSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
                  ? { background: "#00482f", color: "#fff" }
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
                      ? { background: "#008254", color: "#fff" }
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
          className="rounded-lg p-5"
          style={{
            background: "#008254",
          }}
        >
          <div className="text-xs text-white/75 mb-1">Selected Total</div>
          <div className="text-3xl font-bold text-white">
            ৳ {selectedTotal.toLocaleString()}
          </div>
          <div className="text-xs text-white/75 mt-2">
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
  incomeSources,
  onClose,
  onDeposit,
  onUpdateCash,
  onEarnCash,
}: {
  inCash: number;
  banks: IBank[];
  incomeSources: string[];
  onClose: () => void;
  onDeposit: (bank: string, amount: number) => void;
  onUpdateCash: (amount: number) => void;
  onEarnCash: (amount: number, source: string) => void;
}) {
  const { theme } = useTheme();
  const t = tk(theme);
  const [action, setAction] = useState<"deposit" | "earn">("deposit");
  const [amount, setAmount] = useState("");
  const [targetBank, setTargetBank] = useState("");
  const [incomeSource, setIncomeSource] = useState(
    incomeSources[0] || DEFAULT_INCOME_SOURCE,
  );

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
      onEarnCash(amt, incomeSource);
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
            color="#006642"
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
        {action === "earn" && (
          <StyledSelect
            label="Income Source"
            value={incomeSource}
            onChange={(e) => setIncomeSource(e.target.value)}
          >
            {incomeSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </StyledSelect>
        )}
        <PrimaryBtn
          onClick={handleSubmit}
          color={action === "deposit" ? "#006642" : t.success}
        >
          Confirm
        </PrimaryBtn>
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
          className="w-full px-4 py-4 rounded-lg text-left transition-all hover:scale-[1.01] border"
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
          className="w-full px-4 py-4 rounded-lg text-left transition-all hover:scale-[1.01] border"
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

