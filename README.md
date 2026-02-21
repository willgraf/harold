# Coming Soon Page Builder

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
| `brandName` | Your brand/company name | "YourBrand" |
| `tagline` | Tagline shown below the brand name | "Something amazing is coming." |
| `ctaText` | Button text | "Join the Waitlist" |
| `successMessage` | Shown after signup | "You're on the list!" |
| `colors.primary` | Primary/accent color | "#4F46E5" |
| `colors.background` | Page background | "#FFFFFF" |
| `colors.text` | Text color | "#111827" |
| `logoUrl` | URL to your logo (optional) | null |
| `apiUrl` | Your deployed API Gateway URL | "" |

### infra/config.yaml

| Field | Description | Default |
|-------|-------------|---------|
| `storageBackend` | `dynamodb` or `postgres` | "dynamodb" |
| `databaseUrl` | PostgreSQL connection string (only for postgres) | "" |
| `domainName` | Custom domain (future) | "" |

## Storage Backends

**DynamoDB (default):** Zero config, pay-per-request, free tier covers most "coming soon" traffic.

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
