# Decisions Log

Key product and technical decisions with rationale, so they aren't
re-litigated from scratch in a later session. Newest at the bottom.

Format per entry:

```
## YYYY-MM-DD — Decision title
- Decision:
- Why:
- Alternatives considered:
```

---

## 2026-08-15 — Set up the co-founder system
- Decision: Created `skillCoFounder.md` (root) as the activation entry point,
  and this `co-founder/` folder as private working memory (state, log, ideas,
  decisions) so the entry-point file stays lean.
- Why: The user wants a persistent "co-founder" that can resume exactly where
  a prior session left off, without bloating a single file.
- Alternatives considered: Single monolithic file — rejected, would grow
  unbounded and overwhelm context on every invocation.

## 2026-08-15 — Per-item checkboxes drive the Month Total, not per-date
- Decision: When a date has multiple line-items, each item gets its own
  checkbox controlling inclusion in the Month Total; the date-level
  checkbox becomes a select-all/none/partial toggle for that date's items,
  and each date's row-spanned "Total" cell reflects only the currently
  selected items under it (not the fixed full-date total).
- Why: user explicitly asked for per-item granularity, confirmed via a
  clarifying question before implementing (the alternative was keeping
  "whole date" as the atomic selectable unit, which the user's own wording
  ruled out).
- Alternatives considered: keep date-level-only selection with the
  checkbox merely duplicated visually per item (no new behavior) — rejected
  per user's explicit answer.

## 2026-08-15 — "Add Spending" is inline, one item at a time; edit stays a modal
- Decision: Adding a spending is now an inline card above the spreadsheet
  (name + cost + submit, no multi-item builder, no running total shown
  during add). Editing an existing date's items still uses the old modal
  with the full add/remove-item list, since editing genuinely needs that
  list-management UI.
- Why: user explicitly said no more "New Spending" modal and described the
  inline card layout in detail; didn't ask to change editing.
- Alternatives considered: making the inline panel support multiple items
  before committing (closer to the old modal's UX) — rejected, user's spec
  was explicitly single item name+cost+submit, repeatable by resubmitting.

## 2026-08-19 — Spending categories: per-user scope, "Uncategorized" default, add-only
- Decision: Category pills (list lived in new `IMoney.categories: string[]`)
  are shared across all months for a user, not scoped per-month. Existing
  spending items with no category read as a real "Uncategorized" category
  (not silently excluded from all pills). Category creation ships without
  delete/rename in this pass.
- Why: asked the user directly since this touches a data-model shape that
  was already migrated live once before (the earlier "remove display
  name" change) — didn't want to guess and need a second migration. Per-
  user scope avoids re-creating the same categories every month;
  "Uncategorized" as a real pill keeps every item having exactly one
  category, which the pill-toggle-selection mechanic depends on; add-only
  ships the core value (assign + bulk-select) fastest, with delete as a
  known, logged follow-up (see IDEAS.md).
- Alternatives considered: per-month category lists (rejected — more
  setup burden, no clear benefit voiced by the user); leaving legacy
  items with no category / "All only" (rejected — would make the "All"
  pill behave inconsistently vs named pills, and complicate the toggle
  logic for no real gain).
- Implementation note: no live-DB migration was run. `ISpending.item`
  values normalize old bare-number costs into `{ cost, category:
  "Uncategorized" }` at read time in both `parseItem` (DashBoard.tsx) and
  `parseSpendingItem` (Stats.tsx); writes always emit the new shape, so
  data upgrades in place the next time a row is saved.

## 2026-08-19 — Per-item money source (Cash or a specific bank), diffed and validated per-source
- Decision: every spending item now records which money source it was
  paid from (`"Cash"` or a bank name), selectable at create/edit time.
  Money movement moved from "always adjust `inCash` by the spending's
  total" to per-item diffing: for every item that changed between the old
  and new state (added, removed, cost changed, or source changed), net
  the exact delta onto its specific source, then validate *each* source's
  net delta against *that source's* current balance before applying
  anything. Deleting an item restores its cost to whatever source it was
  recorded against, not always cash.
- Why: user asked directly — spending had always silently come out of
  cash; they wanted the option to pick a bank (or cash) per item, with
  "insufficient funds" checked against the source actually selected, and
  deletes putting money back where it actually came from.
- Alternatives considered: a single "source" field on the whole date's
  spending record instead of per-item — rejected because a date's entry
  can hold several unrelated items (see the spreadsheet rework), and
  forcing one source per date would contradict letting each item pick its
  own category, which already set the per-item precedent.
- Implementation note: no schema/model change — `source` lives inside the
  same opaque `item` JSON string as `cost`/`category`, so unlike
  `categories` this didn't need `models/User.ts`, JWT, or
  `cleanUserForClient` changes. Found and fixed a related latent bug while
  doing this: `handleRenameBank` didn't cascade into items' `source`
  field, which would have orphaned references the same way category
  rename would have if left unfixed earlier — patched it to cascade, same
  pattern as `handleRenameCategory`.

## 2026-08-19 — Income sources: pill CRUD on Stats page, live-DB migrated (unlike everything else this session)
- Decision: added `incomeSources: string[]` (top-level, seeded `["Dad"]`)
  and `source` on every `income[]` entry. Pill management (add/rename/
  delete) lives on the Stats page's Income tab, right below its four
  stat cards, and persists immediately via a new `updateIncomeSources`
  server action — Stats.tsx has no deferred-save pattern like the
  dashboard, so there was no draft state to defer into. The dashboard
  only lets you *pick* an existing source when depositing to a bank or
  earning cash (the only two actions that generate income); it doesn't
  manage the pill list itself.
- Why: user asked directly, specifying exact placement (below the income
  stat cards), the first pill name ("Dad"), and that dashboard deposit/
  earn-cash flows should let you pick from those pills.
- **This is the one field this session that got an actual live-DB
  migration**, unlike spending categories/money-source (which were
  normalized at read-time with no migration). Ran across all 5 existing
  users: every income entry backfilled to `source: "Dad"`, every user
  seeded `incomeSources: ["Dad"]`. Verified 0 entries missing a source
  afterward. Why migrate this one and not the others: user explicitly
  said "for now assign all the money from Dad in all existing users in
  the database" — a direct instruction, not an inference — so unlike the
  categories/money-source features there's no defensive read-time
  fallback for a missing `source` on income entries; any future code
  writing an income entry must set one or it'll be blank forever.
- Alternatives considered: reusing the existing `updateMoney` action by
  bolting `incomeSources` onto it — rejected, `incomeSources` isn't part
  of `money` (it's a sibling of `income` at the user root), and piggy-
  backing would've coupled two independently-changing pieces of state
  for no benefit; a small dedicated action was cleaner.

## 2026-08-19 — Overview tab rebuilt: 8 stat cards + combined income/spending trend, no DB migration
- Decision: removed the "Weekly Breakdown" and "Avg Spend by Day of
  Month" charts from Stats' Overview tab. Added 4 income stat cards
  alongside the existing 4 spending ones (8 total), spending recolored
  to a red palette and income to a green one. Replaced the single-line
  "All-Time Spending Trend" area chart with "All-Time Trend" — a
  two-line chart (green Income, red Spending) with an "All Time"/"Year"
  scope toggle.
- Why: user asked directly, pasting the exact sections to remove and the
  exact 4-card block to duplicate for income, and specified the chart
  rename, the two-line behavior, and the color scheme.
- **No database migration was needed or run.** This session's work is
  entirely a Stats-page read/render change over data that was already
  correct in the DB (spending in `money.Months`, income in `income[]`
  with `source`, both already live from prior sessions). Explicitly
  checked per the user's "update the database... if something needed"
  instruction — nothing did.
- Found and fixed a real bug while building this (see the note in
  CLAUDE.md's "Income entries must always be aggregated by month"
  bullet): `calculateMonthlyIncome`/`calculateAllTimeIncome` treated each
  `income[]` entry as one month's row, which was correct back when a
  month had exactly one income entry but broke the moment a month could
  have several (one per source, added earlier the same day). Fixed both
  to sum by month. This wasn't asked for directly, but the new Highest/
  Lowest income-month cards and the combined trend line would have been
  visibly wrong for any user with 2+ income sources active in the same
  month without this fix — it was a prerequisite for the feature working
  correctly, not a separate scope decision.
- Alternatives considered: keeping "Weekly Breakdown"'s underlying
  `calculateWeeklyBreakdown`/`weeklyData` computation vs. deleting it
  outright — kept it, because the Insights tab still depends on it (the
  "busiest week" insight); only `calculateDailyAverages`/`DailyAverage`
  were fully dead after removing their chart, so those were deleted.

## 2026-08-19 — Category rename/delete: allowed except on "All"/"Uncategorized", delete blocked while in use
- Decision: same-day follow-up to the add-only decision above. Every user
  category pill except the two reserved ones (`"All"` — virtual, not a
  real category; `"Uncategorized"` — the fallback every legacy/unassigned
  item resolves to) gets a rename (pencil) and delete (×) control.
  Rename updates the category on every matching item across *all* months,
  not just the currently selected one. Delete is blocked with an alert if
  any item anywhere still carries that category — the user must reassign
  or remove those items first; there's no cascade/bulk-reassign UI.
- Why: user directly asked why edit/delete weren't available, explicitly
  scoping delete to "if it isn't connected with any item" and excluding
  "All"/"Uncategorized" from both actions in the same request.
- Alternatives considered: cascading delete that reassigns affected items
  to "Uncategorized" automatically — not requested; user's own wording
  ("delete: if it isn't connected with any item") implies delete should
  simply refuse rather than silently reassign, so that's what shipped.

## 2026-08-19 — Expense tab: no category-management pills, unlike Income's source pills
- Decision: the new Stats "Expense" tab mirrors the Income tab's layout
  (stat cards, 3 charts) but does **not** get an equivalent to
  `IncomeSourcePills` for add/rename/delete of categories.
- Why: category CRUD (rename cascades across all months, delete blocked
  while in use) already exists in the Dashboard's `CategoryPills`. Income
  sources didn't have an existing management UI anywhere, so
  `IncomeSourcePills` on the Stats page was net-new. Adding a second,
  independent category-CRUD widget in Stats would duplicate that cascade
  logic in two places with real risk of the two drifting out of sync.
  Asked the user directly (three options: skip / read-only display /
  full duplicate CRUD) — they picked skip.
- Alternatives considered: a read-only pill display for visual parity
  with Income — rejected in favor of skipping entirely, since the user
  chose "skip" outright over the read-only middle option.

## 2026-08-19 — Deleted Monthly/Categories/Insights tabs; Balance year picker drives shared state
- Decision: removed the Monthly, Categories, and Insights tabs from
  Stats entirely (not hidden — code and helpers fully deleted), leaving
  Overview/Income/Expense/Balance. Added a local year-picker to the
  Balance tab that writes to the page's existing shared `selectedYear`
  state, not an independent scope.
- Why: direct user instruction to simplify the Stats page down to 4
  tabs. The Balance year-picker's scope (shared vs. tab-local) was
  clarified by the user mid-request: they explicitly want it to affect
  "the whole page," unlike the Income/Expense tabs' own trend-chart
  toggles (which stayed tab-local by design, from an earlier session).
- Alternatives considered: none — this was an explicit, unambiguous
  instruction rather than an open design question.
