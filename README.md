# JB's Exterior Cleaning — Referral Program

"Give $25. Get $50." A referral web app for JB's Exterior Cleaning: every
customer gets a unique link, referrals are tracked from submission through
reward payout, and an admin dashboard manages the whole pipeline. Built to
plug in Jobber's API later without a schema rewrite.

## Stack

- Next.js 16 (App Router, TypeScript) — public pages, admin dashboard, and API routes in one app
- PostgreSQL + Prisma 7 (driver adapter: `@prisma/adapter-pg`)
- Tailwind CSS v4 + hand-rolled shadcn-style UI primitives (`src/components/ui`)
- Zod for validation, `jose` + `bcryptjs` for admin sessions, Upstash for rate limiting, Cloudflare Turnstile for bot protection

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, AUTH_SECRET, ADMIN_SEED_* at minimum
npx prisma migrate dev
npm run seed            # creates the first admin user + default settings row
npm run dev
```

Then log in at `/admin/login` with the `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`
you set in `.env`, or visit a referral page directly once a customer exists
(the seed script creates a demo one at `/refer/DEMO-TEST1`).

### Required environment variables

See `.env.example` for the full list with comments. At minimum for local dev:

- `DATABASE_URL` — Postgres connection string
- `AUTH_SECRET` — random 32+ char string signing admin sessions (`openssl rand -base64 32`)
- `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` / `ADMIN_SEED_NAME` — used once by `npm run seed`

Before deploying publicly, also set:

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — without these, rate limiting falls back to an in-process memory store that doesn't work across multiple server instances
- `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — without these, the bot-protection check is skipped entirely
- `NEXT_PUBLIC_BASE_URL` — used to build absolute share links

Jobber vars (`JOBBER_*`, `TOKEN_ENCRYPTION_KEY`) are Phase 2 — the app runs
fine without them; the admin Settings page just shows Jobber as "Not
Configured".

## Recommended deployment

Vercel (hosting) + Neon (Postgres). Set the same env vars in the Vercel
project settings, then run `npx prisma migrate deploy` against the
production `DATABASE_URL` as part of your deploy step.

## How it works

- Every customer has a `referralCode` (e.g. `DENNIS-K8X2Q7`, generated in
  `src/lib/referral-code.ts`) — never a raw database ID.
- `/refer/[code]` is the public landing page; `/r/[code]` is a short-link
  redirect to it.
- Submitting the form hits `POST /api/referrals`, which rate-limits by IP,
  verifies Turnstile, validates input, checks for a duplicate phone/email
  within 30 days, and creates a `Referral` row plus a `SUBMITTED`
  `ReferralEvent`.
- Admins change a referral's status from `/admin/referrals/[id]`. Moving a
  referral to `JOB_COMPLETED` automatically creates its `Reward`, snapshot-
  ting the amount from the current `ReferralSettings` row so later offer
  changes don't retroactively change rewards already promised.
- `/admin/settings` edits the reward offer amounts shown on the public page.
- `/admin/admins` manages who can log in; only an `OWNER`-role admin can add
  new admin accounts.

## Jobber integration (Phase 2)

The schema already carries nullable `jobberCustomerId` /
`jobberClientId` / `jobberQuoteId` / `jobberJobId` fields, and
`src/lib/jobber/` has the OAuth 2.0 scaffolding (authorize URL, token
exchange/refresh, encrypted token storage) plus stub routes for the OAuth
callback and webhook receiver. None of it makes a live GraphQL call yet —
before wiring up any mutation, confirm the operation and required scopes
against Jobber's current published GraphQL schema, and confirm the real
webhook signature header/payload shape against their current docs before
trusting `src/app/api/jobber/webhook/route.ts` beyond verify-and-log.

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint`
- `npm run seed` — creates the seed admin + default settings (idempotent)
- `npx prisma studio` — browse the database
- `npx prisma migrate dev --name <name>` — new migration during development
