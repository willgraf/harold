# Coming Soon Page Builder — Design

## Overview

A developer-first scaffold for deploying "Coming Soon / Join the Waitlist" landing pages on AWS. Developers clone the repo, edit two YAML config files, and deploy via CDK. Designed so a self-service UI can be layered on top in the future.

## Architecture

```
Static Site (Next.js export) → S3 → CloudFront (CDN/SSL)
                                          ↓
                                   User visits page,
                                   submits email
                                          ↓
                                    API Gateway (POST /api/signup)
                                          ↓
                                       Lambda
                                      ↙      ↘
              SignupRepository           SNS Topic
              (DynamoDB default,         (integration hook)
               Postgres optional)
```

## Frontend

- **Framework:** Next.js with `output: 'export'` (static export, no SSR)
- **Styling:** Tailwind CSS
- **Single page** with: Hero, CTA button, Signup form, Footer
- **Config-driven:** `site/config.yaml` controls brand name, tagline, colors, CTA text, logo URL, API URL
- **Colors** from config injected as CSS custom properties

### site/config.yaml

```yaml
brandName: "YourBrand"
tagline: "Something amazing is coming."
ctaText: "Join the Waitlist"
successMessage: "You're on the list!"
colors:
  primary: "#4F46E5"
  background: "#FFFFFF"
  text: "#111827"
logoUrl: null
apiUrl: ""
```

## Backend

### API

Single endpoint: `POST /api/signup`

- Request: `{ "email": "user@example.com" }`
- Response: `200 { "message": "Success" }` or `400`/`500` with error
- Validates email format
- Saves via repository
- Publishes to SNS topic

### Repository Pattern

```typescript
interface SignupRepository {
  saveSignup(email: string, timestamp: string, ip: string): Promise<void>
}
```

Two implementations:

- **DynamoDBSignupRepository** (default) — partition key: `email`, sort key: `timestamp`, duplicate prevention via condition expression
- **PostgresSignupRepository** — `signups` table (`email VARCHAR UNIQUE, signed_up_at TIMESTAMP, ip VARCHAR`), uses `pg` client with connection string from env var

Selected at Lambda cold start via `STORAGE_BACKEND` env var (defaults to `dynamodb`).

### SNS Integration Hook

Every successful signup publishes `{ email, timestamp, source }` to an SNS topic. Customers subscribe their own endpoints (webhook URLs, SQS queues, email addresses).

## Infrastructure (CDK TypeScript)

- **S3 Bucket** — static site, private (CloudFront-only access)
- **CloudFront Distribution** — HTTPS, default root `index.html`
- **API Gateway (REST)** — `/signup` POST with CORS
- **Lambda** — signup handler, bundled with esbuild via `NodejsFunction`
- **DynamoDB Table** — `signups` (created when storage backend is dynamodb)
- **SNS Topic** — `signup-notifications`
- **IAM** — least-privilege (Lambda → DynamoDB + SNS publish)

### infra/config.yaml

```yaml
storageBackend: dynamodb  # or 'postgres'
databaseUrl: ""           # only needed for postgres
domainName: ""            # optional custom domain (future)
```

## Repo Structure

```
newproject/
├── site/                    # Next.js static site
│   ├── config.yaml
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── components/
│   │       ├── Hero.tsx
│   │       ├── SignupForm.tsx
│   │       └── Footer.tsx
│   └── public/
├── infra/                   # CDK infrastructure
│   ├── config.yaml
│   ├── package.json
│   ├── bin/
│   │   └── app.ts
│   └── lib/
│       ├── static-site-stack.ts
│       └── api-stack.ts
├── lambda/                  # Signup handler
│   ├── package.json
│   ├── handler.ts
│   └── repositories/
│       ├── index.ts         # Interface + factory
│       ├── dynamodb.ts
│       └── postgres.ts
├── docs/
│   └── plans/
└── README.md
```

## Developer Workflow

1. Clone repo
2. Edit `site/config.yaml` (brand, colors, copy)
3. Edit `infra/config.yaml` (storage backend choice)
4. `cd infra && npx cdk deploy` — deploys everything
5. Site is live

## Future Enhancements (Not MVP)

- **Duplicate detection** — distinct response when email already exists
- **Email verification** — SES confirmation link, mark signup as verified
- **Custom domain** — Route 53 + ACM certificate via CDK config
- **Self-service UI** — web dashboard that generates config.yaml and triggers deploy
- **WAF** — rate limiting on the signup endpoint
