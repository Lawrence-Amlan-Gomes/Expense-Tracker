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
- One user's live spending data (`amlangomes@gmail.com`) was manually
  categorized earlier this session via a one-off script — 432 items, all
  given a real category, verified cost-neutral. Backup was scratchpad-
  only (already gone, not in the repo).
- `tsc --noEmit`, `npm run lint`, and `npm run build` all clean (0 errors)
  as of the end of this session.
- **Still not manually verified in an actual browser** (no
  screenshot/browser tool available this session) — spendings rework,
  categories, money-source, income-sources, AND the Overview rebuild are
  only proven via build/lint/typecheck. **Top priority next session.**
  Especially: add/edit a spending item against a non-Cash source and
  confirm the right bank moves; delete an item and confirm money
  restores correctly; overspend a specific bank and confirm the alert
  names it; add/rename/delete an income source pill on Stats and confirm
  it persists; deposit/earn cash with a non-default income source and
  confirm it lands correctly; check the Overview tab's 8 cards + the
  All-Time Trend chart's both scopes render sensibly for a real account.

## In progress
- Nothing mid-flight.

## Exact next step to resume
- Ask the user what they want to work on next, or review
  `co-founder/IDEAS.md` for backlog items if they have no immediate ask.
- Do the browser click-through described above — never yet visually
  confirmed any of this session's or the previous session's work.

## Session port
- Dev server running this session on port 3001 (port 3000 was occupied by
  an external process, PID 3616, not started by us — left untouched per
  port safety rule).

## Open questions / blockers
- `skills/skill_buildCheck_gitADD_gitCommit_gitPush.md` still shows as a
  deleted file in `git status` (pre-existing, not from any of my sessions,
  last touched in commit `6272310`). Still unstaged/uncommitted on
  purpose — ask the user whether to restore or formally delete it when
  convenient.
- The 39 npm audit vulnerabilities from the first `npm install` haven't
  been triaged.
