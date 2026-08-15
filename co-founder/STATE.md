# Current State

> Read this file first, every session. It is the single source of truth for
> "where did we leave off." Keep it current — overwrite stale sections, don't
> just append.

## Where things stand
- Co-founder system (this folder + `skillCoFounder.md`) live since 2026-08-15.
- Dashboard spendings feature was reworked into a spreadsheet-style table
  (one row per line-item, per-item checkboxes driving the Month Total,
  row-spanned date/total cells), the "display name" concept was removed
  from spendings (`item` is now a flat `{itemName: cost}` JSON map, migrated
  across all users' live DB data), and "New Spending" became an inline
  `AddSpendingPanel` above the table instead of a modal (`SpendingModal` is
  edit-only now). Full detail in `co-founder/LOG.md`'s 2026-08-15 entry.
- This session (same day, follow-up): fixed "Add Spending" not scrolling
  the panel into view when opened while scrolled down the table — added
  `desktopSpendingsScrollRef` / `mobileSpendingsScrollRef` and a
  `useEffect` that smooth-scrolls to top when `addSpendingOpen` flips true.
  `tsc`/`eslint` clean.
- Still not manually verified in an actual browser (no screenshot/browser
  tool available this session) — the whole spendings rework + this
  auto-scroll fix are only proven via build/lint/typecheck so far.

## In progress
- Nothing mid-flight.

## Exact next step to resume
- Ask the user what they want to work on next, or review
  `co-founder/IDEAS.md` for backlog items if they have no immediate ask.
- Do an actual browser click-through of the spendings table +
  AddSpendingPanel (add/edit/delete, checkbox states, the new auto-scroll,
  mobile layout) next time it's convenient — never yet visually confirmed.

## Session port
- Dev server killed at End Today. No dev server running right now — start
  a fresh one next session and report the port.

## Open questions / blockers
- `skills/skill_buildCheck_gitADD_gitCommit_gitPush.md` still shows as a
  deleted file in `git status` (pre-existing, not from any of my sessions,
  last touched in commit `6272310`). Still unstaged/uncommitted on
  purpose — ask the user whether to restore or formally delete it when
  convenient.
- The 39 npm audit vulnerabilities from the first `npm install` haven't
  been triaged.
