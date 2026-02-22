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

The site uses `output: 'export'` (static HTML only — no SSR, no API routes, no dynamic server features). `SignupForm` is the only `"use client"` component; everything else is server-rendered at build time.

### Repository Pattern (lambda)
`lambda/repositories/index.ts` defines the `SignupRepository` interface and `createRepository()` factory. The factory reads `STORAGE_BACKEND` env var and returns either `DynamoDBSignupRepository` or `PostgresSignupRepository`. Both implement `saveSignup() → Promise<boolean>` where `true` = new signup, `false` = duplicate email (de-duplication handled at storage layer).

### CDK Stacks (infra)
Two stacks in `infra/bin/app.ts`:
- **HaroldSite** (`static-site-stack.ts`): S3 bucket + CloudFront distribution, deploys from `site/out/`
- **HaroldApi** (`api-stack.ts`): API Gateway + Lambda + DynamoDB table + SNS topic. Reads `infra/config.yaml` via `loadInfraConfig()`.

### Lambda Handler
`lambda/handler.ts` handles POST (email signup) and OPTIONS (CORS preflight). On new signup: saves to repository → publishes to SNS (if `SNS_TOPIC_ARN` is set). On duplicate: returns "Already registered", skips SNS.

## Key Conventions

- YAML for all developer-facing config (not JSON)
- Jest with ts-jest for tests; tests live in `__tests__/` directories (only `lambda/` has a full test suite currently)
- Mocks for AWS SDK clients are hoisted with `jest.mock()` before imports
- Lambda env vars (`SNS_TOPIC_ARN`, `STORAGE_BACKEND`, `TABLE_NAME`, `DATABASE_URL`) are set in `beforeEach` blocks in tests
- Tailwind v4 with `@theme` directive — avoid adding custom CSS; use Tailwind utility classes
- Adding a new storage backend: implement `SignupRepository` interface, add a case to `createRepository()` factory in `lambda/repositories/index.ts`
