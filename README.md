# Harold

The launch page builder that heralds your next big thing. (His friends call him Harold.)

A scaffold for deploying "Coming Soon / Join the Waitlist" landing pages on AWS. Edit two YAML config files, deploy with CDK, and start collecting emails. Requires **Node 22**.

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
   npm -w site run build
   ```

6. Deploy:

   ```bash
   cd infra && npx cdk deploy --all
   ```

7. Your site is live at the CloudFront URL shown in the deploy output.

## Configuration

### site/config.yaml

| Field | Description | Default |
| ------- | ------------- | --------- |
| `brandName` | Your brand/company name | required |
| `tagline` | Eyebrow text above the headline | "" |
| `headline` | Main hero headline | "" |
| `description` | Body text below the headline | "" |
| `ctaText` | Signup button text | required |
| `successMessage` | Shown after successful signup (no verification) | "Welcome aboard. We'll be in touch." |
| `verificationPendingMessage` | Shown after signup when verification is enabled | "Check your email to confirm your spot." |
| `verificationSuccessMessage` | Shown after email is verified | "You're confirmed! We'll be in touch." |
| `githubUrl` | Link to your GitHub repo — shown in nav, hero, and footer | "" |
| `siteUrl` | Canonical URL — used for OG metadata | "" |
| `features` | Array of `{title, description, icon}` feature cards | [] |
| `socialProof.line1` | First stat/proof line | "" |
| `socialProof.line2` | Second stat/proof line | "" |
| `colors.primary` | Primary accent color | "#D4593C" |
| `colors.accent` | Secondary accent | "#E8A84C" |
| `colors.background` | Page background | "#09090B" |
| `colors.surface` | Card/input backgrounds | "#13131A" |
| `colors.text` | Primary text color | "#EDE9E1" |
| `colors.textMuted` | Secondary text color | "#7A756E" |
| `fonts.display` | Headline font (Google Fonts name) | "DM Serif Display" |
| `fonts.body` | Body font (Google Fonts name) | "Instrument Sans" |
| `logoUrl` | URL to your logo image (optional) | null |
| `apiUrl` | API endpoint — use `/prod` when deploying via CDK | "/prod" |

### infra/config.yaml

| Field | Description | Default |
| ------- | ------------- | --------- |
| `storageBackend` | `dynamodb` or `postgres` | "dynamodb" |
| `databaseUrl` | PostgreSQL connection string (postgres only) | "" |
| `domainName` | Custom domain e.g. `example.com` — see [Custom Domain](#custom-domain) | "" |
| `certificateArn` | ACM certificate ARN (must be in us-east-1) — required when `domainName` is set | "" |
| `siteUrl` | Your site's URL — required when email verification is enabled | "" |
| `brandName` | Used in verification email subject and body | "" |
| `emailVerification.enabled` | Send a verification email before confirming signup | false |
| `emailVerification.senderEmail` | From address for verification emails (must be SES-verified) | "" |
| `emailVerification.tokenExpiryHours` | How long a verification link stays valid | 24 |

## Custom Domain

By default Harold deploys to a CloudFront URL like `https://d1k29j.cloudfront.net`. To use your own domain:

### 1. Request an ACM certificate

ACM certificates for CloudFront **must be created in us-east-1**, regardless of where your stack is deployed.

1. Open [ACM in us-east-1](https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1)
2. Click **Request** → **Request a public certificate**
3. Enter your domain name (e.g. `example.com`)
4. Choose **DNS validation**
5. Click **Request**

ACM will show you a CNAME record to add to your DNS provider. Add it and wait for the status to change to **Issued** (usually a few minutes).

### 2. Update infra/config.yaml

```yaml
domainName: "example.com"
certificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/abc-123"
```

### 3. Redeploy

```bash
cd infra && npx cdk deploy HaroldSite
```

### 4. Point your DNS at CloudFront

Add a `CNAME` record at your registrar pointing your domain to the CloudFront distribution URL (printed as `SiteUrl` in the deploy output). If your registrar supports `ALIAS` or `ANAME` records you can use those for the root domain instead.

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

If you later enable email verification, apply the migration in `docs/postgres-migration.sql`.

## Email Verification

When `emailVerification.enabled` is true, signups receive a verification link via SES before their address is published to SNS. Duplicate emails and invalid/expired tokens are handled automatically.

To enable:

1. [Verify your sender address in SES](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html)
2. Set in `infra/config.yaml`:

   ```yaml
   siteUrl: "https://example.com"
   brandName: "Your Brand"
   emailVerification:
     enabled: true
     senderEmail: "no-reply@yourdomain.com"
   ```

3. Redeploy: `cd infra && npx cdk deploy HaroldApi`

## SNS Integration Hook

Confirmed signups publish to an SNS topic (duplicates and unverified emails are skipped). Subscribe your own endpoints to get notified:

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
└── docs/           # Postgres migration SQL and design docs
```

## Tech Stack

- **Frontend:** Next.js 16, Tailwind CSS 4, TypeScript
- **Backend:** AWS Lambda, API Gateway, SES, SNS
- **Storage:** DynamoDB (default) or PostgreSQL
- **Infrastructure:** AWS CDK (TypeScript)
