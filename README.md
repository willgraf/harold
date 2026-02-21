# Harold

The launch page builder that heralds your next big thing. (His friends call him Harold.)

A scaffold for deploying "Coming Soon / Join the Waitlist" landing pages on AWS. Edit two YAML config files, deploy with CDK, and start collecting emails.

## Quick Start

1. Clone this repo
2. Edit `site/config.yaml` with your brand details
3. Edit `infra/config.yaml` to choose your storage backend
4. Install dependencies:
   ```bash
   npm install
   ```
5. Build the site:
   ```bash
   cd site && npm run build
   ```
6. Deploy:
   ```bash
   cd infra && npx cdk deploy --all
   ```
7. Your site is live! The deploy output shows your CloudFront URL and API URL.
8. Update `apiUrl` in `site/config.yaml` with the API URL from step 6, rebuild and redeploy.

## Configuration

### site/config.yaml

| Field | Description | Default |
|-------|-------------|---------|
| `brandName` | Your brand/company name | "Arcadia" |
| `tagline` | Eyebrow text above the headline | "The future of creative collaboration." |
| `headline` | Main hero headline | "Where bold ideas find their audience." |
| `description` | Body text below the headline | (lorem ipsum) |
| `ctaText` | Signup button text | "Get Early Access" |
| `successMessage` | Shown after signup | "Welcome aboard. We'll be in touch." |
| `features` | Array of `{title, description, icon}` | 3 example features |
| `socialProof.line1` | First stat/proof line | "2,400+ creators on the waitlist" |
| `socialProof.line2` | Second stat/proof line | "Launching Spring 2026" |
| `colors.primary` | Primary accent color | "#D4593C" |
| `colors.accent` | Secondary accent | "#E8A84C" |
| `colors.background` | Page background | "#09090B" |
| `colors.surface` | Card/input backgrounds | "#13131A" |
| `colors.text` | Primary text color | "#EDE9E1" |
| `colors.textMuted` | Secondary text color | "#7A756E" |
| `fonts.display` | Headline font (Google Fonts) | "DM Serif Display" |
| `fonts.body` | Body font (Google Fonts) | "Instrument Sans" |
| `logoUrl` | URL to your logo (optional) | null |
| `apiUrl` | Your deployed API Gateway URL | "" |

### infra/config.yaml

| Field | Description | Default |
|-------|-------------|---------|
| `storageBackend` | `dynamodb` or `postgres` | "dynamodb" |
| `databaseUrl` | PostgreSQL connection string (only for postgres) | "" |
| `domainName` | Custom domain (future) | "" |

## Storage Backends

**DynamoDB (default):** Zero config, pay-per-request, free tier covers most launch page traffic.

**PostgreSQL:** Set `storageBackend: postgres` and provide `databaseUrl`. Compatible with Supabase, Neon, RDS, or any PostgreSQL instance. Requires a `signups` table:

```sql
CREATE TABLE signups (
  email VARCHAR(255) UNIQUE NOT NULL,
  signed_up_at TIMESTAMP NOT NULL,
  ip VARCHAR(45)
);
```

## SNS Integration Hook

Every signup publishes to an SNS topic. Subscribe your own endpoints to get notified:

```bash
# Subscribe a webhook
aws sns subscribe \
  --topic-arn <SnsTopicArn from deploy output> \
  --protocol https \
  --notification-endpoint https://your-webhook.com/signup

# Subscribe an email
aws sns subscribe \
  --topic-arn <SnsTopicArn from deploy output> \
  --protocol email \
  --notification-endpoint you@example.com
```

## Project Structure

```
├── site/           # Next.js static site (edit config.yaml here)
├── lambda/         # Signup Lambda handler + repository pattern
├── infra/          # AWS CDK infrastructure
└── docs/plans/     # Design and implementation docs
```

## Tech Stack

- **Frontend:** Next.js 16, Tailwind CSS 4, TypeScript
- **Backend:** AWS Lambda, API Gateway, SNS
- **Storage:** DynamoDB (default) or PostgreSQL
- **Infrastructure:** AWS CDK (TypeScript)
