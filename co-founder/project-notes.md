# Project Notes

## Stack
- Next.js 16 (App Router, Turbopack, React Compiler), React 19, TypeScript, Tailwind 3.4.
- State: Redux Toolkit (auth, theme, price, response). Auth user is kept in localStorage (`authUser`, `authToken`).
- Auth: custom email/password (server actions in `src/app/actions`) + Google via next-auth.
- DB: MongoDB (mongoose). Charts: recharts. Icons: lucide-react.
- Env files exist (`.env.local`, `.env.production`). Never copy their values anywhere.

## Routes
- `/` = gate: logged in → `/dashBoard`; logged out → landing (`HomeGate.tsx`, `Landing.tsx`).
- `/home` redirects to `/`. App pages: dashBoard, stats, calculator, pricing, billing, profile, changePassword, login, register, admin, testimonials, privacy-policy, terms-and-conditions.

## Design system (from `DESIGN.md`, NerdWallet)
- Tokens are CSS variables in `src/app/globals.css` ("R G B" channels), mapped in `tailwind.config.ts`.
  Classes: `bg-canvas bg-soft bg-surface bg-mint-50/100/200 border-hairline text-ink text-body text-muted bg-primary text-brand bg-lime-* text-link text-error`.
- Dark mode = `<html data-theme="dark">`. Set by an inline script in `layout.tsx` (before paint) and `ThemeWrapper.tsx`. Choice saved in localStorage `theme`.
- Redux `theme` is still `true = light`, `false = dark` (JS-driven colours in Dashboard/Stats use it).
- Component classes in globals.css: `.btn-primary .btn-secondary .btn-outline .btn-lime .btn-danger .card .panel-mint .tip-panel .hero-band .field .eyebrow .badge-compare .award-pill`.
- Shared components: `Logo`, `PageBand` (green band for inner pages), `AuthShell`, `EachField`, `HeroImage` (hero.png + SVG fallback).
- Font: Montserrat (Gotham substitute). Body 400 in app; `font-light` (300) on marketing copy.
- Radius: buttons `rounded-sm` (2px), cards `rounded-lg`, tiles `rounded-xl`, panels `rounded-2xl`. Almost no shadows.
- Dashboard.tsx and Stats.tsx keep their own token functions (`tk()` and `getThemeTokens()`); they were re-coloured, not rewritten.
- Chart palette: spruce green, info blue, lime, error red. No warm accents.
- Nav is `sticky` (h-16). Pages need no top offset. Dashboard uses `h-[calc(100dvh-64px)]`.

## Ideas to make the SaaS better
- Real testimonials + pricing copy; write Privacy and Terms.
- Verify the whole app in a browser, both themes, mobile + desktop.
