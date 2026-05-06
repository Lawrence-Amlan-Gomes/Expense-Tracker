# skill_buildCheck_gitADD_gitCommit_gitPush

When the user prompts **"Do skill_buildCheck_gitADD_gitCommit_gitPush.md"**, execute the following steps in order. Do not skip steps. Do not ask for confirmation between steps unless something fails in a way that requires user input.

---

## Step 1 — Build check & fix all errors

1. Run `npm run build` from the project root.
2. If the build fails:
   - Read every error in the output (TypeScript errors, ESLint errors, Next.js build errors, missing imports, type mismatches, etc.).
   - Fix each error at its source file. Do **not** suppress errors with `// @ts-ignore`, `// eslint-disable`, or `any` shortcuts unless there is genuinely no other option and the user is informed.
   - Re-run `npm run build` after fixes.
   - Repeat until `npm run build` exits with code 0 and shows a clean successful build.
3. Also resolve any TypeScript errors and ESLint errors surfaced during the build:
   - For TypeScript: fix types properly (correct interfaces, narrow unions, handle `null`/`undefined`, fix server-action return types per [CLAUDE.md](../CLAUDE.md) conventions).
   - For ESLint: fix the underlying issue (unused vars, missing deps, import order, etc.). Run `npm run lint` if needed to confirm it is clean.
4. Only proceed to Step 2 once `npm run build` succeeds end-to-end with no errors.

## Step 2 — Git add

Run:

```bash
git add .
```

## Step 3 — Git commit

1. Inspect the staged diff (`git status` + `git diff --staged`) to understand what actually changed in this update.
2. Write a **professional, short commit message** (a single line, ideally under 70 characters) that accurately describes the latest update — focus on the *what* and *why*, not a file list. Examples of tone:
   - `fix: resolve auth slice null state on logout`
   - `feat: add stats chart empty state`
   - `chore: tighten typing on money mapping`
3. Run:

```bash
git commit -m "<the message you wrote>"
```

Do **not** add a Claude/co-author trailer for this skill — keep the commit message clean and minimal.

If a pre-commit hook fails, fix the underlying issue, re-stage, and create a **new** commit (do not `--amend`).

## Step 4 — Git push

Run:

```bash
git push origin main
```

If the push is rejected (non-fast-forward), run `git pull --rebase origin main`, resolve any conflicts, then push again. Never use `--force` unless the user explicitly asks.

---

## Reporting back

After all four steps succeed, give the user a one or two sentence summary: confirm the build passed, the commit hash/message, and that the push to `origin main` succeeded. Nothing else.
