# Idea Backlog

Product, growth, and technical improvement ideas for the expense tracker SaaS.
Not commitments — a running list to pull from when the user has no specific ask.
Add a one-line rationale so future-you knows why it seemed worth doing.

## Product
- (none yet)

## Technical / debt
- `itemKey()` (DashBoard.tsx) bakes the whole `spending.item` JSON string
  into the selection key. Editing any sub-item within a date's spending
  (cost, name, or now category) changes that whole string, invalidating
  `selectedItemKeys` for every sub-item under that date until the month is
  re-selected (the `useEffect` that rebuilds `selectedItemKeys` only fires
  on month-switch or spendings-count change, not content change). Net
  effect: after editing a row, previously-checked items under that date
  can silently read as unchecked (or vice versa) until you leave and
  re-enter the month. Pre-existing before the 2026-08-19 category work,
  not caused by it, but worth fixing — key on `date` + stable per-item id
  instead of the serialized item blob.
- Category rename/delete shipped 2026-08-19 (same-day follow-up to the
  original add-only decision) — see DECISIONS.md.

## Growth / monetization
- (none yet)

## Parked / rejected
- Ideas considered and explicitly set aside, with the reason, so they aren't
  re-proposed later without new information.
