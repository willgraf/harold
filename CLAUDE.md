# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Harold is a scaffold for deploying "Coming Soon / Join the Waitlist" landing pages on AWS. Developers clone the repo, edit two YAML config files (`site/config.yaml` for branding, `infra/config.yaml` for infrastructure), and deploy with CDK.

**Requires Node 22** (see `.nvmrc`).

## Commands

```bash
npm install               # Install all workspaces from root
```

```bash
npm -w site run build     # Next.js static export → site/out/
npm -w lambda run build   # TypeScript compile
npm -w infra run build    # TypeScript compile
```

```bash
npm -w infra test                               # All infra tests
npm -w lambda test                              # All lambda tests
npm -w lambda test -- --testPathPattern handler  # Single test file
```

```bash
npm -w site run dev       # Next.js dev server
```

```bash
cd infra && npx cdk deploy --all  # Deploy both stacks
```

## Architecture

**Monorepo with npm workspaces** — three packages: `site/`, `lambda/`, `infra/`.

### Theming Pipeline (site)
Config flows: `site/config.yaml` → `loadConfig()` in `site/src/lib/config.ts` → `layout.tsx` sets `--site-*` CSS custom properties on `<body>` → Tailwind v4 `@theme` block in `globals.css` maps `--site-*` vars to Tailwind tokens (`--color-primary`, `--font-display`, etc.) → components use standard Tailwind classes like `text-primary`, `bg-surface`, `font-display`.

The `--site-*` prefix prevents collision with Tailwind's `@theme` namespace. All component styling is pure Tailwind except two custom CSS classes in `globals.css`: `.text-gradient` (animated gradient text needing `background-clip`) and `body::before` (grain texture overlay).

The site uses `output: 'export'` (static HTML only — no SSR, no API routes, no dynamic server features). `SignupForm` is the only `"use client"` component; everything else is server-rendered at build time. SignupForm reads `?verified=true|false` from the URL on mount to show verification status after redirect from the verify endpoint.

### Repository Pattern (lambda)
`lambda/repositories/index.ts` defines the `SignupRepository` interface and `createRepository()` factory. The factory reads `STORAGE_BACKEND` env var and returns either `DynamoDBSignupRepository` or `PostgresSignupRepository`. Both implement:
- `saveSignup(record) → Promise<boolean>` — `true` = new signup, `false` = duplicate email (de-duplication at storage layer)
- `verifyEmail(token) → Promise<{ success, email?, alreadyVerified? }>` — validates token, marks email verified, idempotent on re-clicks

### CDK Stacks (infra)
Two stacks in `infra/bin/app.ts`:
- **HaroldSite** (`static-site-stack.ts`): S3 bucket + CloudFront distribution, deploys from `site/out/`
- **HaroldApi** (`api-stack.ts`): API Gateway + Lambda + DynamoDB table + SNS topic. Reads `infra/config.yaml` via `loadInfraConfig()`. When `emailVerification.enabled`: adds DynamoDB GSI (`VerificationTokenIndex`), grants `ses:SendEmail`/`ses:SendRawEmail`, upgrades table to `grantReadWriteData`.

### Lambda Handler
`lambda/handler.ts` routes by path + HTTP method:
- `OPTIONS *` → CORS preflight
- `POST /signup` → `handleSignup()` — email signup
- `GET /verify` → `handleVerify()` — email verification redirect
- `POST /` (no `/verify`) → `handleSignup()` (legacy backward compat)
- Everything else → 404

**Without verification** (`EMAIL_VERIFICATION_ENABLED=false`): save → publish SNS → return "Success". Duplicate → "Already registered", no SNS.

**With verification** (`EMAIL_VERIFICATION_ENABLED=true`): save with token → send SES verification email → return `{ verificationRequired: true }`. SNS fires only after the user clicks the verify link and `GET /verify` confirms the token. SES/SNS failures are caught and logged but don't fail the request.

### Email Verification (config-toggled)
Toggled via `infra/config.yaml` → `emailVerification.enabled`. When enabled:
- `lambda/tokenUtils.ts` generates base64url tokens with configurable expiry
- `lambda/emailTemplates.ts` renders HTML verification email (XSS-safe via `escapeHtml()`)
- DynamoDB uses a `VerificationTokenIndex` GSI for token lookups; Postgres uses a partial index
- `handleVerify` validates token format (`/^[A-Za-z0-9_-]+$/`, max 100 chars), delegates to `repository.verifyEmail()`, returns 302 redirect to `SITE_URL?verified=true|false`
- Already-verified tokens return success but skip SNS (idempotent)
- When disabled, `GET /verify` returns redirect with `?verified=false` immediately (no GSI query)

## Key Conventions

- YAML for all developer-facing config (not JSON)
- Jest with ts-jest for tests; tests live in `__tests__/` directories — `lambda/` and `infra/` both have full suites
- Mocks for AWS SDK clients are hoisted with `jest.mock()` before imports
- Lambda env vars (`SNS_TOPIC_ARN`, `STORAGE_BACKEND`, `TABLE_NAME`, `DATABASE_URL`, `EMAIL_VERIFICATION_ENABLED`, `EMAIL_SENDER`, `API_URL`, `SITE_URL`, `BRAND_NAME`, `EMAIL_VERIFICATION_EXPIRY_HOURS`) are set in `beforeEach` blocks in tests
- Tailwind v4 with `@theme` directive — avoid adding custom CSS; use Tailwind utility classes
- Adding a new storage backend: implement `SignupRepository` interface (including `verifyEmail`), add a case to `createRepository()` factory in `lambda/repositories/index.ts`
- Postgres schema changes for verification are in `docs/postgres-migration.sql`
- `lambda/dist/` and `infra/dist/` are gitignored and not committed — the CI/CD workflow builds them before deploying; run `npm -w lambda run build` / `npm -w infra run build` locally before running `cdk deploy`
- `gh` CLI is not installed — use the GitHub web UI or API for PR/Actions operations
