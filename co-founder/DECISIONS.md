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
