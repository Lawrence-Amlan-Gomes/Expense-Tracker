# CLAUDE.md

## Project Overview
A Next.js 16 (App Router) expense tracking web app. Users register/login (credentials or Google OAuth), verify their email, and manage personal finances: bank accounts, cash, monthly spendings, and income. Includes Stripe + Paddle billing, an admin view, a Gemini-powered prompt input, and a Recharts-based stats page. Free week trial with `paymentType` upgrade flow.

## Tech Stack
- **Framework**: Next.js `^16.1.1` (App Router, React Compiler enabled), React `19.2.0`
- **Language**: TypeScript `^5.9.3` (strict, `target: ES2017`, `@/*` → `./src/*`)
- **Styling**: Tailwind CSS `^3.4.1` + `tailwind-scrollbar`, PostCSS, `framer-motion`, `lucide-react`, `react-icons`
- **State**: Redux Toolkit `^2.10.1` + `react-redux` + `redux-persist`
- **DB**: MongoDB via Mongoose `^8.19.3`
- **Auth**: NextAuth `^5.0.0-beta.30` (Google provider only) + custom JWT (`jose` + `jsonwebtoken`) for credential auth; passwords hashed with `bcrypt` (also `bcryptjs` present)
- **Payments**: Stripe (`stripe`, `@stripe/react-stripe-js`, `@stripe/stripe-js`) and Paddle (`@paddle/paddle-js`)
- **AI**: `@google/genai` (Gemini)
- **Email**: `nodemailer` (server) + `@emailjs/browser` (client), with `react-oauth/google` for client-side Google sign-in
- **Charts**: `recharts`
- **Lint**: ESLint `^9` with `eslint-config-next` + TypeScript ESLint

## Project Structure
```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (Google_Sans font, metadata)
│   ├── ClientLayout.tsx        # Client-side wrapper (Redux/theme providers)
│   ├── page.tsx                # Landing page
│   ├── auth.ts                 # NextAuth v5 config (Google provider)
│   ├── server.ts               # Server entry helpers
│   ├── globals.css
│   ├── not-found.tsx
│   ├── actions/index.ts        # Server actions (auth, user, money, JWT, logout)
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── verify-jwt/route.ts
│   │   └── verify-email/route.ts
│   ├── hooks/                  # Typed Redux hooks (useAuth, useTheme, usePrice, useResponse)
│   ├── color/color.ts          # Theme color tokens
│   ├── testimonials/, pricing/, billing/, profile/, dashBoard/,
│   ├── home/, login/, register/, changePassword/, calculator/,
│   ├── stats/, admin/, error/, privacy-policy/, terms-and-conditions/
├── components/                 # All UI (DashBoard, Stats, LoginForm, Profile, ...)
├── lib/
│   ├── mongo.ts                # `dbConnect()` Mongoose helper
│   ├── data-util.ts            # `cleanUserForClient` etc.
│   └── server/
│       ├── jwt.ts              # generateToken / verifyToken (jose)
│       └── email.ts            # nodemailer email helpers
├── models/User.ts              # Mongoose User schema (money, income)
└── store/
    ├── store.ts                # Redux store (auth, theme, price, response)
    ├── ReduxProvider.tsx
    └── features/{auth,theme,price,response}/*Slice.ts
public/                         # Icons, images, theme assets
```

## Getting Started
1. `npm install`
2. Create `.env.local` with the variables in the [Environment Variables](#environment-variables) table
3. Ensure MongoDB is reachable via `MONGODB_URI`
4. `npm run dev` → http://localhost:3000

## Development Commands
```bash
npm run dev      # next dev (App Router, React Compiler)
npm run build    # next build
npm start        # next start (production server)
npm run lint     # eslint
```

## Architecture & Key Concepts
- **App Router + Server Actions**: Mutations live in [src/app/actions/index.ts](src/app/actions/index.ts) (`"use server"`). Pages call them directly; on success they `revalidatePath` the affected route.
- **Dual auth**:
  - Credential login: `performLogin` validates against MongoDB with bcrypt, then issues a custom JWT via [src/lib/server/jwt.ts](src/lib/server/jwt.ts) (verified at [src/app/api/verify-jwt/route.ts](src/app/api/verify-jwt/route.ts)).
  - Google OAuth: NextAuth v5 Google provider in [src/app/auth.ts](src/app/auth.ts), handler at [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth/%5B...nextauth%5D/route.ts). After Google sign-in a JWT is also generated via `generateJwtForGoogle`.
- **Email verification**: `createUser` sends a verification link to `${NEXTAUTH_URL}/api/verify-email?email=...`; [src/app/api/verify-email/route.ts](src/app/api/verify-email/route.ts) flips `isEmailVerified` and triggers `sendVerificationSuccessEmail`. Google sign-ups skip verification (auto-verified).
- **Data model** ([src/models/User.ts](src/models/User.ts)): `User { name, email, password, photo, firstTimeLogin, isAdmin, paymentType, isEmailVerified, expiredAt, money: { banks[], inCash, Months[].spendings[] }, income[] }`. `Months` and nested arrays use `_id: false` and default `[]`.
- **Client state**: Redux store at [src/store/store.ts](src/store/store.ts) with slices `auth`, `theme`, `price`, `response`. `redux-persist` actions are excluded from `serializableCheck`.
- **Billing**: `paymentType` defaults to `"Free One Week"` with `expiredAt = createdAt + 7d`. Upgrades flow through Stripe and Paddle (see [src/components/Billing.tsx](src/components/Billing.tsx), [src/app/billing/page.tsx](src/app/billing/page.tsx)).
- **Image domains**: `lh3.googleusercontent.com` is whitelisted in [next.config.ts](next.config.ts) for Google profile photos.

## Code Conventions
- Path alias: `@/*` → `src/*`. Always import via `@/...`, not relative.
- Server-only files mark mutations with `"use server"` at file or function top.
- Server actions return plain objects (`CleanUser`, `{ success, error }`); never return Mongoose documents — convert via `cleanUserForClient` or explicit mapping (see `mapIncome`, the inline `money` mapping in `findUserByEmail`).
- Mongoose model is registered with `mongoose.models.users || mongoose.model<IUser>("users", UserSchema)` to survive HMR.
- Tailwind-only styling; no CSS modules. Theme tokens live in [src/app/color/color.ts](src/app/color/color.ts) and are toggled via the `theme` Redux slice + [src/components/ThemeWrapper.tsx](src/components/ThemeWrapper.tsx).
- React 19 + React Compiler is enabled (`reactCompiler: true` in [next.config.ts](next.config.ts)) — do not add manual `useMemo`/`useCallback` micro-optimizations unless profiling justifies it.
- TypeScript is strict; prefer explicit return types on server actions and exported util functions.

## Environment Variables
Loaded from `.env.local` (dev) / `.env.production`.

| Variable | Purpose | Required |
|----------|---------|----------|
| `MONGODB_URI` | MongoDB connection string used by `dbConnect()` | Yes |
| `NEXTAUTH_URL` | Base URL used to build verification links | Yes |
| `NEXTAUTH_SECRET` | NextAuth v5 secret | Yes |
| `JWT_SECRET` | Secret for custom JWT (`src/lib/server/jwt.ts`) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client id | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `GEMINI_API_KEY` | `@google/genai` API key (PromptInput) | Yes |
| `EMAIL_USER` | Nodemailer sender account | Yes |
| `EMAIL_PASS` | Nodemailer sender password / app password | Yes |
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | Client EmailJS service id | Yes |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | Client EmailJS template id | Yes |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | Client EmailJS public key | Yes |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle client token | Yes (billing) |
| `NEXT_PUBLIC_PADDLE_ENV` | Paddle environment (`sandbox`/`production`) | Yes (billing) |

Stripe keys are not currently in `.env.local` despite Stripe being installed — add `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` if/when wiring Stripe, and update this table.

## Testing
No test framework is currently configured (no `jest`, `vitest`, or `__tests__` directory). When tests are introduced, document the runner and command here.

## Important Notes for AI Assistance
- **Always read CLAUDE.md before starting any task; update it after any change to stack, commands, env vars, structure, conventions, or gotchas.**
- The path-alias convention is `@/*` — do not introduce deep relative imports.
- Both `bcrypt` and `bcryptjs` are installed. Server actions in [src/app/actions/index.ts](src/app/actions/index.ts) use `bcrypt`; prefer that for new server-side hashing to avoid mixing implementations.
- `dbConnect()` swallows errors with `console.log(err)` and returns `undefined` on failure — callers currently assume success. Be explicit if you need failure handling.
- Mongoose model name is `"users"` (lowercase, plural). Don't rename without a migration.
- Server actions must return only plain serializable objects to client components; convert ObjectIds and Dates to strings (existing code uses `_id.toString()` and `Date.toISOString()`).
- React Compiler is on — avoid hand-rolling memoization unless there's a measured reason.
- Email verification is bypassed for Google sign-ups (`isGoogleAuth = !data.password`); preserve this behavior.
- The repo has the deleted file `public/video.mp4` showing in `git status` — it's a tracked deletion, not a missing asset to restore unless asked.
