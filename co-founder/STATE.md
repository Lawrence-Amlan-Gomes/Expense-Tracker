# Current State

> Read this file first, every session. It is the single source of truth for
> "where did we leave off." Keep it current — overwrite stale sections, don't
> just append.

## Where things stand
- Co-founder system (this folder + `skillCoFounder.md`) live since 2026-08-15.
- **Dashboard spendings**: spreadsheet-style table, no modals. "Add
  Spending" is an inline `AddSpendingPanel` above the table; editing is
  inline too (clicking a row expands it into `EditableSpendingRow`).
  Each item carries `{ cost, category, source }`. `category` (added
  2026-08-19) drives `CategoryPills` (add/rename/delete, "All" +
  "Uncategorized" reserved). `source` (same day) is which bank or "Cash"
  paid for that item, drives per-item money movement
  (`computeMoneyDeltas`/`applyMoneyDeltas` in DashBoard.tsx — validates
  and applies against the specific source, not always cash; deletes
  restore to the recorded source). Neither `category` nor `source` got a
  live-DB migration — both normalize legacy shapes at read time
  (`parseItem`). Full history: `co-founder/LOG.md`,
  `co-founder/DECISIONS.md` (search "2026-08-19").
- **Income sources** (2026-08-19, same session): `IUser.incomeSources:
  string[]` (top-level, sibling of `income`, seeded `["Dad"]`). Every
  `income[]` entry gained `source: string`. Pill CRUD
  (`IncomeSourcePills`) lives on the **Stats page**'s Income tab (now
  right after Overview in tab order), below its 4 stat cards, and
  persists immediately via the new `updateIncomeSources` server action —
  Stats.tsx has no deferred-save pattern, unlike the dashboard. The
  **dashboard** only *selects* a source when depositing to a bank
  (`BankModal`) or earning cash (`CashModal`) — the only two income-
  generating actions. **Unlike categories/spending-source, this field
  WAS live-DB migrated** (explicit user request) — all 5 existing users'
  income entries backfilled to `source: "Dad"`, verified 0 missing
  afterward. No read-time fallback exists for a missing income source,
  so any future write path must always set one.
- **Stats Overview tab rebuilt** (2026-08-19, same session): removed the
  "Weekly Breakdown" and "Avg Spend by Day of Month" charts (the latter's
  underlying `calculateDailyAverages`/`DailyAverage` were deleted
  outright as dead code; `calculateWeeklyBreakdown`/`weeklyData` were
  kept — Insights still uses it). Added 4 income stat cards next to the
  existing 4 spending ones (8 total: red family for spending, green for
  income). Replaced the single-line "All-Time Spending Trend" chart with
  "All-Time Trend" — a 2-line chart (green Income, red Spending) with an
  "All Time"/"Year" pill toggle (`trendScope` state) top-right. Along the
  way, fixed a real bug: `calculateMonthlyIncome`/`calculateAllTimeIncome`
  didn't aggregate multiple income entries per month (possible since the
  income-source feature earlier this session let one month hold several
  entries) — now both sum by month first. **No DB migration was needed**
  for this piece — checked explicitly per the user's ask, confirmed
  nothing to change (this was a read-side computation fix only).
- **All-Time Trend year picker** (2026-08-19, same session, follow-up):
  the "Year" pill next to the All-Time Trend chart had no way to pick
  *which* year — it silently used the page's top-nav `selectedYear` with
  no visible control on the chart itself. Added a small year dropdown
  next to the "All Time"/"Year" pills (opens on click, lists
  `availableYears`, writes to the same shared `selectedYear` state so it
  stays in sync with the rest of the page).
- **Live-DB categorization corrected 2026-08-19 (new session)**: the
  prior session's claim of having categorized `amlangomes@gmail.com`
  was wrong — the user explicitly asked for **all existing users**, and
  a DB check this session found `amlangomes@gmail.com` actually had
  *zero* categorized items (the earlier script's write never persisted
  or was reverted; root cause unconfirmed). Also found `amlan100ai@gmail.com`
  (a data-copy of `amlangomes`, from an earlier session's account-copy
  op) had 15 items with stray ad-hoc category names not in its
  (empty) `money.categories` list — non-functional in the UI. Fixed:
  ran a corrected one-off script (`categorize_all.js`, scratchpad-only,
  not in repo) against all 3 users with any spending items —
  `amlangomes@gmail.com` (432 items), `amlan100ai@gmail.com` (417
  items, same underlying vocab as amlangomes so the same 209-name map
  covered both at 100%), and `bandygaming555king@gmail.com` (1 item,
  "honey" → Groceries). Set the same 15-category `money.categories`
  list on all three. Verified cost-neutral (sum unchanged) before
  writing, and re-verified post-write: all items now have a real
  category, 0 fell through to "Uncategorized". The 2 users with no
  spending items (`amlanbrac@gmail.com`, `lawrenceamlan12gomes@gmail.com`)
  were left untouched — nothing to categorize.
- `tsc --noEmit`, `npm run lint`, and `npm run build` all clean (0 errors)
  as of the end of this session.
- **Browser verification is now possible headlessly** (new capability,
  same session as the fixes above): Playwright + Chromium are available
  via the npx cache even though `playwright` isn't a project dependency
  — `require("/Users/lawrencealangomes/.npm/_npx/e41f203b7505f1fb/node_modules/playwright")`
  works directly from a plain Node script (no `npm install` needed). To
  get a logged-in session for screenshots: mint a JWT server-side with
  `jose`'s `SignJWT` using `JWT_SECRET`/the real user doc (same shape as
  `generateToken` in `lib/server/jwt.ts`), POST it to `/api/verify-jwt`
  to get the `CleanUser` JSON back, then use
  `context.addInitScript(...)` to pre-seed **both**
  `localStorage.authToken` AND `localStorage.authUser` *before* first
  navigation — seeding only the token forces the app through
  `ReduxProvider`'s async verify-jwt fallback, which races with
  `Stats.tsx`'s own data-fetch effect and can leave the page stuck on
  `/login` or showing all-zero data. Also: the page body does **not**
  grow for `fullPage` screenshots — the real scroll container is a
  `div.h-screen.overflow-y-auto` wrapper, so either use a generously
  tall `viewport` (2400px worked) or target that element directly.
- **Stats "Income" tab rebuilt (2026-08-19, later same day)**: all 6
  stat cards now green (was a mix of green/indigo/amber/purple); added
  2 cards (Lowest Month, Income Sources count); added a 2nd chart,
  "All-Time Income Trend" (single green line, same All-Time/Year toggle
  + year-dropdown as Overview's combined trend, own `incomeTrendScope`
  state); moved the pre-existing "Monthly Income — {year}" bar chart
  below it; added a 3rd chart, "{month} Income — {year}" (bar chart,
  X-axis = income source, Y-axis = amount), with a month dropdown that
  only lists months with actual income data for the selected year.
  Verified live in-browser (see technique above) against
  `amlangomes@gmail.com`'s real data — all working, including month/year
  switching and cross-tab sync via the shared `selectedYear`.
- **Stats "Expense" tab added (2026-08-19, later same day)**: new tab
  right after Income, structurally identical to the rebuilt Income tab
  but red family (6 cards: Total/Monthly Avg/Highest/Lowest Expense,
  All-Time Expense, Categories count) and reusing Overview's existing
  spending vars rather than recomputing. Same 3-chart layout, with the
  one deliberate difference the user asked for: the 3rd chart's X-axis
  is `category` (via new `calculateExpenseByCategory` +
  `parseSpendingItemDetailed` helpers, since the existing
  `parseSpendingItem` discards the `category` field) instead of income
  source. **No category-management pills row** — user chose to skip
  duplicating category CRUD here since it already lives in the
  Dashboard's `CategoryPills`; see `co-founder/DECISIONS.md`. Verified
  live in-browser, including month-switching on the category chart and
  a full click-through of every other tab to confirm no regressions.
- **Monthly/Categories/Insights tabs deleted (2026-08-19, later same
  day, explicit user request)**: Stats now has exactly 4 tabs — Overview
  → Income → Expense → Balance. Deleted the 3 tabs' JSX plus every
  helper/type/component that only they used: `calculateCategoryTotals`/
  `categoryData`, `calculateWeeklyBreakdown`/`weeklyData`,
  `generateInsights`/`insights`/`InsightCard`, `buildFlatSpendings`/
  `flatSpendings`/`parseSpendingItem`/`FlatSpending`/`SubItem`, plus now-
  unused imports (`Sparkles`, recharts' `RadarChart`/`PolarGrid`/
  `PolarAngleAxis`/`Radar`/`PieChart-as-RechartsPieChart`/`Pie`). This
  also resolves the "Categories tab groups by item name, not real
  category" tech debt noted earlier — moot now that the tab is gone.
  File went from ~3132 to ~2121 lines. `tsc --noEmit`, `npm run lint`,
  and `npm run build` all clean throughout; verified live in-browser
  (tab bar shows exactly the 4 remaining tabs, no console errors
  clicking through all of them).
- **Balance tab gained its own year picker (same session, same
  request)**: small header at the top of the tab ("BALANCE / Showing
  data for {year}" + a `{year} ▾` dropdown), wired to the *same* shared
  `selectedYear` state the sticky header's picker uses — changing it
  here changes it page-wide (only new local state: `isBalanceYearDropdownOpen`,
  for the dropdown's open/closed UI). No new data plumbing needed,
  since every Balance stat/chart already derived from `selectedYear`.
  Verified live: switching to 2025 from the Balance tab's own dropdown
  updated the sticky header to "2025" too and recalculated every card/
  chart on the tab.

## In progress
- Nothing mid-flight.

## Exact next step to resume
- Ask the user what they want to work on next, or review
  `co-founder/IDEAS.md` for backlog items if they have no immediate ask.
- Dashboard-side flows (non-Cash source spending edits, overspend
  alerts, income-source pill CRUD persistence, deposit/earn-cash with a
  non-default source) are still only proven via build/lint/typecheck,
  not browser-verified — worth doing next using the same Playwright/JWT
  technique now that it's established.

## Session port
- Dev server killed at End Today (was port 3001, pid 97402; port 3000
  remained occupied by an external process the whole session, not
  started by us, never touched). No dev server running right now —
  start a fresh one next session and report the port.

## Open questions / blockers
- `skills/skill_buildCheck_gitADD_gitCommit_gitPush.md` still shows as a
  deleted file in `git status` (pre-existing, not from any of my sessions,
  last touched in commit `6272310`). Still unstaged/uncommitted on
  purpose — ask the user whether to restore or formally delete it when
  convenient.
- The 39 npm audit vulnerabilities from the first `npm install` haven't
  been triaged.
