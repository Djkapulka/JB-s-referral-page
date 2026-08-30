# JB's Exterior Cleaning — Referral Program

"Give $25. Get $50." A standalone referral web app for JB's Exterior
Cleaning: every customer gets a unique link, referrals are tracked from
submission through reward payout, and an admin dashboard manages the whole
pipeline. This v1 has no external CRM dependency — the database is simply
*structured* so a Jobber integration could be added later without a schema
rewrite, but nothing in this build talks to Jobber.

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
- `/api/health` is a simple uptime check for monitoring.

## Future CRM integration

`Customer` and `Referral` carry a few nullable, unused columns
(`jobberCustomerId`, `jobberClientId`, `jobberQuoteId`, `jobberJobId`) purely
so a future integration — Jobber or otherwise — can be added without an
invasive migration. Nothing in this codebase reads or writes them, and there
is no integration code of any kind in this build.

## Production deployment

Recommended: **Vercel** (hosting) + **Neon** (Postgres) — both have free
tiers and need no local setup on your end besides an account.

1. Create a Neon Postgres project, copy its connection string.
2. Create a Vercel project from this GitHub repo (branch `claude/jbs-referral-system-8vtmft`, or merge it to `main` first).
3. In Vercel's project settings, add every variable from `.env.example` (at minimum `DATABASE_URL`, `AUTH_SECRET`; strongly recommended before real traffic: `UPSTASH_REDIS_REST_URL`/`TOKEN` and `TURNSTILE_*`; set `NEXT_PUBLIC_BASE_URL` to your real domain).
4. Deploy. `postinstall` runs `prisma generate` automatically as part of the Vercel build, so no extra build config is needed.
5. Run the schema migration against the production database once, from your machine: `DATABASE_URL="<your prod url>" npx prisma migrate deploy`.
6. Run the seed script the same way to create your first admin login: `DATABASE_URL="<your prod url>" ADMIN_SEED_EMAIL=... ADMIN_SEED_PASSWORD=... ADMIN_SEED_NAME=... npm run seed`.
7. (Optional) Point your own domain at the Vercel project.

Re-run step 5 (`prisma migrate deploy`) any time the schema changes in a future update — it's safe to run repeatedly, it only applies migrations that haven't been applied yet.

## Security notes

- Admin sessions are signed JWTs in an `httpOnly`, `sameSite=lax` cookie; `AUTH_SECRET` must be a strong random value in production — the app refuses to start a session without one long enough.
- All admin routes and APIs are gated by `src/middleware.ts`, which rejects any request to `/admin/*` or `/api/admin/*` without a valid session.
- Passwords are hashed with bcrypt (cost 12); login always runs a bcrypt compare even for a nonexistent email, so response timing doesn't leak which emails exist.
- The public referral submission endpoint is rate-limited by IP, checks a Cloudflare Turnstile token, rejects an obviously bot-filled honeypot field with a fake success response, and validates every field server-side with Zod regardless of client-side checks.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are set globally in `next.config.ts`.
- `/robots.txt` disallows crawling `/admin`.
- All database access goes through Prisma's parameterized queries — no raw SQL string interpolation anywhere in the app.

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint`
- `npm run seed` — creates the seed admin + default settings (idempotent)
- `npx prisma studio` — browse the database
- `npx prisma migrate dev --name <name>` — new migration during development
- `npx prisma migrate deploy` — apply pending migrations to production
