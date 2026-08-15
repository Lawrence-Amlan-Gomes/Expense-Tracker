# Current State

> Read this file first, every session. It is the single source of truth for
> "where did we leave off." Keep it current — overwrite stale sections, don't
> just append.

## Where things stand
- Co-founder system (this folder + `skillCoFounder.md`) is live since
  2026-08-15. `node_modules` had to be installed on first run this session
  (630 packages, 39 audit vulnerabilities reported, none addressed — not
  urgent, worth a look eventually).
- Copied `money`/`income` data from amlangomes@gmail.com to
  amlan100ai@gmail.com (a second real test/dev account) at the user's
  request, on the live Atlas DB (`ExpenseTracker` cluster). Identity/auth
  fields were left untouched.
- Reworked the dashboard spendings feature end-to-end (all in
  `src/components/DashBoard.tsx`, plus a couple of matching changes in
  `src/components/Stats.tsx`):
  1. Replaced the old card-list of spendings with a spreadsheet-style
     `SpendingsTable` (Date / Item / Cost / Total columns, zebra rows).
  2. Exploded each date into one row per line-item (was one row per date),
     with row-spanned date/checkbox/total cells and per-item checkboxes.
     Per-item checkboxes independently control inclusion in the Month
     Total; the date-level checkbox is a select-all/partial/none toggle for
     that date's items.
  3. Removed the "display name" concept entirely from spendings. A
     spending's `item` field is now a flat JSON map `{itemName: cost}` —
     **no more wrapping `"Name"` key.** This was migrated across **all 5
     users / 341 spendings** in the live DB (backup saved at
     `/private/tmp/claude-501/.../scratchpad/money-months-backup.json` —
     that path is session-scratch and will not survive; re-derive from git
     history / this note if ever needed, or just re-copy from a user's
     current `money.Months` before any future risky migration).
  4. Replaced the "New Spending" modal with an inline `AddSpendingPanel`
     card rendered above the table (both desktop and mobile) — adds one
     item at a time to a day, merging into that day's existing entry if
     one exists. `SpendingModal` is now edit-only (opened by clicking a
     row) — the dead "New Spending" / add-path code was removed from it.
  5. Validation errors in `AddSpendingPanel` render inline in the card
     (red text, auto-clears on next edit) instead of `alert()`.
  - All of this passed `tsc --noEmit`, `eslint`, and a full `next build`
    each step. Not manually verified in an actual browser (no
    screenshot/browser tool available this session) — worth a manual
    click-through next time before treating it as fully proven.
- Noticed (not caused by this session) a stray tracked deletion:
  `skills/skill_buildCheck_gitADD_gitCommit_gitPush.md` shows as deleted in
  `git status`, last touched in commit `6272310` (pre-dates this session).
  Left unstaged/uncommitted — flagged to the user and noted in CLAUDE.md
  rather than acted on. If it comes up again, ask the user whether to
  restore or formally delete it.

## In progress
- Nothing mid-flight. The spendings-table rework above is complete and
  committed.

## Exact next step to resume
- Ask the user what they want to work on next, or review
  `co-founder/IDEAS.md` for backlog items if they have no immediate ask.
- If picking UI work back up: do an actual browser click-through of the new
  spendings table + AddSpendingPanel (add/edit/delete, checkbox
  select-all/partial states, mobile layout) since it's only been verified
  by build/lint/typecheck so far.

## Session port
- Dev server killed at End Today (was PID 10476 on :3001). No dev server
  running right now — start a fresh one next session and report the port.

## Open questions / blockers
- The stray `skills/` deletion noted above — decide restore vs. formally
  delete next time it's convenient to ask the user.
- The 39 npm audit vulnerabilities from `npm install` haven't been triaged.
