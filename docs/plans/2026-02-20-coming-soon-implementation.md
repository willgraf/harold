# Coming Soon Page Builder — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a deployable "Coming Soon" landing page scaffold with email signup, powered by AWS (S3+CloudFront, API Gateway, Lambda, DynamoDB/Postgres, SNS).

**Architecture:** Next.js static export served via S3+CloudFront. Single POST /api/signup endpoint via API Gateway+Lambda. Repository pattern for storage (DynamoDB default, Postgres optional). SNS topic as integration hook. All infra via CDK TypeScript.

**Tech Stack:** Next.js 16, Tailwind CSS 4, TypeScript, AWS CDK v2, Lambda (Node.js), DynamoDB, SNS, js-yaml

---

### Task 1: Initialize Repo & Root Config

**Files:**
- Create: `.gitignore`
- Create: `.nvmrc`
- Create: `package.json` (root workspace)

**Step 1: Create .gitignore**

```gitignore
node_modules/
.next/
out/
cdk.out/
*.js.map
*.d.ts
.env
.env.local
```

**Step 2: Create .nvmrc**

```
22
```

**Step 3: Create root package.json**

```json
{
  "name": "coming-soon-builder",
  "private": true,
  "workspaces": ["site", "lambda", "infra"]
}
```

**Step 4: Commit**

```bash
git add .gitignore .nvmrc package.json
git commit -m "chore: initialize repo with workspaces"
```

---

### Task 2: Scaffold Next.js Site

**Files:**
- Create: `site/package.json`
- Create: `site/next.config.js`
- Create: `site/tsconfig.json`
- Create: `site/postcss.config.js`
- Create: `site/config.yaml`
- Create: `site/src/app/layout.tsx`
- Create: `site/src/app/page.tsx`
- Create: `site/src/app/globals.css`
- Create: `site/public/.gitkeep`

**Step 1: Create site/package.json**

```json
{
  "name": "coming-soon-site",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^16",
    "react": "^19",
    "react-dom": "^19",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5.7",
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4"
  }
}
```

**Step 2: Create site/next.config.js**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
};

module.exports = nextConfig;
```

**Step 3: Create site/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**Step 4: Create site/postcss.config.js**

```js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**Step 5: Create site/config.yaml**

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

**Step 6: Create site/src/app/globals.css**

```css
@import "tailwindcss";

:root {
  --color-primary: #4F46E5;
  --color-background: #FFFFFF;
  --color-text: #111827;
}
```

**Step 7: Create site/src/lib/config.ts**

Config loader that reads YAML at build time:

```typescript
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface SiteConfig {
  brandName: string;
  tagline: string;
  ctaText: string;
  successMessage: string;
  colors: {
    primary: string;
    background: string;
    text: string;
  };
  logoUrl: string | null;
  apiUrl: string;
}

export function loadConfig(): SiteConfig {
  const configPath = path.join(process.cwd(), "config.yaml");
  const raw = fs.readFileSync(configPath, "utf-8");
  return yaml.load(raw) as SiteConfig;
}
```

**Step 8: Create site/src/app/layout.tsx**

Minimal layout that injects CSS custom properties from config:

```tsx
import type { Metadata } from "next";
import { loadConfig } from "@/lib/config";
import "./globals.css";

const config = loadConfig();

export const metadata: Metadata = {
  title: `${config.brandName} — Coming Soon`,
  description: config.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={
          {
            "--color-primary": config.colors.primary,
            "--color-background": config.colors.background,
            "--color-text": config.colors.text,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
```

**Step 9: Create site/src/app/page.tsx (placeholder)**

```tsx
export default function Home() {
  return <main>Coming Soon</main>;
}
```

**Step 10: Create site/public/.gitkeep**

Empty file.

**Step 11: Install dependencies and verify build**

```bash
cd site && npm install && npm run build
```

Expected: Builds successfully, produces `out/` directory.

**Step 12: Commit**

```bash
git add site/
git commit -m "feat: scaffold Next.js site with Tailwind and YAML config"
```

---

### Task 3: Build Frontend Components

**Files:**
- Create: `site/src/components/Hero.tsx`
- Create: `site/src/components/SignupForm.tsx`
- Create: `site/src/components/Footer.tsx`
- Modify: `site/src/app/page.tsx`
- Modify: `site/src/app/globals.css`

**Step 1: Create Hero component**

`site/src/components/Hero.tsx`:

```tsx
interface HeroProps {
  brandName: string;
  tagline: string;
  logoUrl: string | null;
}

export default function Hero({ brandName, tagline, logoUrl }: HeroProps) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {logoUrl && (
        <img src={logoUrl} alt={`${brandName} logo`} className="mb-8 h-16" />
      )}
      <h1 className="mb-4 text-5xl font-bold" style={{ color: "var(--color-text)" }}>
        {brandName}
      </h1>
      <p className="max-w-md text-xl opacity-70" style={{ color: "var(--color-text)" }}>
        {tagline}
      </p>
    </section>
  );
}
```

**Step 2: Create SignupForm component**

`site/src/components/SignupForm.tsx`:

```tsx
"use client";

import { useState } from "react";

interface SignupFormProps {
  ctaText: string;
  successMessage: string;
  apiUrl: string;
}

export default function SignupForm({ ctaText, successMessage, apiUrl }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch(`${apiUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Signup failed");
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <section className="flex flex-col items-center px-4 py-16 text-center">
        <p className="text-xl font-semibold" style={{ color: "var(--color-primary)" }}>
          {successMessage}
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center px-4 py-16">
      <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border px-4 py-3 text-base outline-none focus:ring-2"
          style={{ borderColor: "var(--color-primary)", focusRingColor: "var(--color-primary)" } as React.CSSProperties}
          disabled={status === "loading"}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {status === "loading" ? "..." : ctaText}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </section>
  );
}
```

**Step 3: Create Footer component**

`site/src/components/Footer.tsx`:

```tsx
interface FooterProps {
  brandName: string;
}

export default function Footer({ brandName }: FooterProps) {
  return (
    <footer className="py-8 text-center text-sm opacity-50" style={{ color: "var(--color-text)" }}>
      &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
    </footer>
  );
}
```

**Step 4: Update page.tsx to compose components**

`site/src/app/page.tsx`:

```tsx
import { loadConfig } from "@/lib/config";
import Hero from "@/components/Hero";
import SignupForm from "@/components/SignupForm";
import Footer from "@/components/Footer";

export default function Home() {
  const config = loadConfig();

  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <Hero
        brandName={config.brandName}
        tagline={config.tagline}
        logoUrl={config.logoUrl}
      />
      <SignupForm
        ctaText={config.ctaText}
        successMessage={config.successMessage}
        apiUrl={config.apiUrl}
      />
      <Footer brandName={config.brandName} />
    </main>
  );
}
```

**Step 5: Verify build**

```bash
cd site && npm run build
```

Expected: Builds successfully.

**Step 6: Commit**

```bash
git add site/
git commit -m "feat: add Hero, SignupForm, and Footer components"
```

---

### Task 4: Lambda — Repository Interface & DynamoDB Implementation

**Files:**
- Create: `lambda/package.json`
- Create: `lambda/tsconfig.json`
- Create: `lambda/repositories/index.ts`
- Create: `lambda/repositories/dynamodb.ts`
- Create: `lambda/__tests__/repositories/dynamodb.test.ts`

**Step 1: Create lambda/package.json**

```json
{
  "name": "coming-soon-lambda",
  "private": true,
  "scripts": {
    "test": "jest --config jest.config.js",
    "build": "tsc"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3",
    "@aws-sdk/client-sns": "^3",
    "pg": "^8.13.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8",
    "@types/jest": "^29",
    "@types/pg": "^8",
    "jest": "^29",
    "ts-jest": "^29",
    "typescript": "^5.7"
  }
}
```

**Step 2: Create lambda/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

**Step 3: Create lambda/jest.config.js**

```js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
};
```

**Step 4: Create repository interface**

`lambda/repositories/index.ts`:

```typescript
export interface SignupRecord {
  email: string;
  timestamp: string;
  ip: string;
}

export interface SignupRepository {
  saveSignup(record: SignupRecord): Promise<void>;
}

export function createRepository(): SignupRepository {
  const backend = process.env.STORAGE_BACKEND || "dynamodb";

  switch (backend) {
    case "dynamodb": {
      const { DynamoDBSignupRepository } = require("./dynamodb");
      return new DynamoDBSignupRepository();
    }
    case "postgres": {
      const { PostgresSignupRepository } = require("./postgres");
      return new PostgresSignupRepository();
    }
    default:
      throw new Error(`Unknown storage backend: ${backend}`);
  }
}
```

**Step 5: Write failing test for DynamoDB repository**

`lambda/__tests__/repositories/dynamodb.test.ts`:

```typescript
import { DynamoDBSignupRepository } from "../../repositories/dynamodb";

const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(() => ({ send: mockSend })),
  PutItemCommand: jest.fn((input: unknown) => ({ input })),
}));

describe("DynamoDBSignupRepository", () => {
  beforeEach(() => {
    process.env.TABLE_NAME = "test-signups";
    mockSend.mockReset();
  });

  it("saves a signup record", async () => {
    mockSend.mockResolvedValue({});

    const repo = new DynamoDBSignupRepository();
    await repo.saveSignup({
      email: "test@example.com",
      timestamp: "2026-01-01T00:00:00Z",
      ip: "127.0.0.1",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("throws if TABLE_NAME not set", () => {
    delete process.env.TABLE_NAME;
    expect(() => new DynamoDBSignupRepository()).toThrow();
  });
});
```

**Step 6: Run test to verify it fails**

```bash
cd lambda && npm install && npm test
```

Expected: FAIL — `Cannot find module '../../repositories/dynamodb'`

**Step 7: Implement DynamoDB repository**

`lambda/repositories/dynamodb.ts`:

```typescript
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SignupRecord, SignupRepository } from "./index";

export class DynamoDBSignupRepository implements SignupRepository {
  private client: DynamoDBClient;
  private tableName: string;

  constructor() {
    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      throw new Error("TABLE_NAME environment variable is required");
    }
    this.tableName = tableName;
    this.client = new DynamoDBClient({});
  }

  async saveSignup(record: SignupRecord): Promise<void> {
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: {
          email: { S: record.email },
          timestamp: { S: record.timestamp },
          ip: { S: record.ip },
        },
        ConditionExpression: "attribute_not_exists(email)",
      })
    );
  }
}
```

**Step 8: Run test to verify it passes**

```bash
cd lambda && npm test
```

Expected: PASS

**Step 9: Commit**

```bash
git add lambda/
git commit -m "feat: add repository interface and DynamoDB implementation"
```

---

### Task 5: Lambda — Postgres Repository Implementation

**Files:**
- Create: `lambda/repositories/postgres.ts`
- Create: `lambda/__tests__/repositories/postgres.test.ts`

**Step 1: Write failing test**

`lambda/__tests__/repositories/postgres.test.ts`:

```typescript
import { PostgresSignupRepository } from "../../repositories/postgres";

const mockQuery = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({ query: mockQuery })),
}));

describe("PostgresSignupRepository", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://localhost:5432/test";
    mockQuery.mockReset();
  });

  it("saves a signup record", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const repo = new PostgresSignupRepository();
    await repo.saveSignup({
      email: "test@example.com",
      timestamp: "2026-01-01T00:00:00Z",
      ip: "127.0.0.1",
    });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO signups"),
      ["test@example.com", "2026-01-01T00:00:00Z", "127.0.0.1"]
    );
  });

  it("throws if DATABASE_URL not set", () => {
    delete process.env.DATABASE_URL;
    expect(() => new PostgresSignupRepository()).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd lambda && npm test -- --testPathPattern=postgres
```

Expected: FAIL

**Step 3: Implement Postgres repository**

`lambda/repositories/postgres.ts`:

```typescript
import { Pool } from "pg";
import { SignupRecord, SignupRepository } from "./index";

export class PostgresSignupRepository implements SignupRepository {
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    this.pool = new Pool({ connectionString });
  }

  async saveSignup(record: SignupRecord): Promise<void> {
    await this.pool.query(
      "INSERT INTO signups (email, signed_up_at, ip) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
      [record.email, record.timestamp, record.ip]
    );
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd lambda && npm test
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add lambda/
git commit -m "feat: add Postgres repository implementation"
```

---

### Task 6: Lambda — Signup Handler

**Files:**
- Create: `lambda/handler.ts`
- Create: `lambda/__tests__/handler.test.ts`

**Step 1: Write failing test**

`lambda/__tests__/handler.test.ts`:

```typescript
const mockSaveSignup = jest.fn();
const mockPublish = jest.fn();

jest.mock("../repositories/index", () => ({
  createRepository: () => ({ saveSignup: mockSaveSignup }),
}));

jest.mock("@aws-sdk/client-sns", () => ({
  SNSClient: jest.fn(() => ({ send: mockPublish })),
  PublishCommand: jest.fn((input: unknown) => ({ input })),
}));

import { handler } from "../handler";

describe("signup handler", () => {
  beforeEach(() => {
    process.env.SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:123456789:test-topic";
    process.env.STORAGE_BACKEND = "dynamodb";
    process.env.TABLE_NAME = "test-signups";
    mockSaveSignup.mockReset();
    mockPublish.mockReset();
  });

  it("returns 200 for valid email", async () => {
    mockSaveSignup.mockResolvedValue(undefined);
    mockPublish.mockResolvedValue({});

    const event = {
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(mockSaveSignup).toHaveBeenCalledTimes(1);
    expect(mockPublish).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for missing email", async () => {
    const event = {
      body: JSON.stringify({}),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const event = {
      body: JSON.stringify({ email: "not-an-email" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(400);
  });

  it("returns CORS headers", async () => {
    mockSaveSignup.mockResolvedValue(undefined);
    mockPublish.mockResolvedValue({});

    const event = {
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd lambda && npm test -- --testPathPattern=handler
```

Expected: FAIL

**Step 3: Implement handler**

`lambda/handler.ts`:

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { createRepository } from "./repositories/index";

const repository = createRepository();
const sns = new SNSClient({});
const topicArn = process.env.SNS_TOPIC_ARN;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(statusCode: number, body: object): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const email: string | undefined = body.email;

    if (!email || !EMAIL_REGEX.test(email)) {
      return response(400, { message: "Valid email is required" });
    }

    const timestamp = new Date().toISOString();
    const ip = event.requestContext?.identity?.sourceIp || "unknown";

    await repository.saveSignup({ email, timestamp, ip });

    if (topicArn) {
      await sns.send(
        new PublishCommand({
          TopicArn: topicArn,
          Message: JSON.stringify({ email, timestamp, source: "coming-soon" }),
        })
      );
    }

    return response(200, { message: "Success" });
  } catch (err) {
    console.error("Signup error:", err);
    return response(500, { message: "Internal server error" });
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
cd lambda && npm test
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add lambda/
git commit -m "feat: add signup Lambda handler with SNS publishing"
```

---

### Task 7: CDK Infrastructure — Static Site Stack

**Files:**
- Create: `infra/package.json`
- Create: `infra/tsconfig.json`
- Create: `infra/config.yaml`
- Create: `infra/bin/app.ts`
- Create: `infra/lib/config.ts`
- Create: `infra/lib/static-site-stack.ts`

**Step 1: Create infra/package.json**

```json
{
  "name": "coming-soon-infra",
  "private": true,
  "scripts": {
    "build": "tsc",
    "cdk": "cdk",
    "test": "jest"
  },
  "dependencies": {
    "aws-cdk-lib": "^2",
    "constructs": "^10",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^22",
    "aws-cdk": "^2",
    "typescript": "^5.7"
  }
}
```

**Step 2: Create infra/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["bin/**/*.ts", "lib/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create infra/config.yaml**

```yaml
storageBackend: dynamodb  # or 'postgres'
databaseUrl: ""           # only needed for postgres
domainName: ""            # optional custom domain (future)
```

**Step 4: Create infra/lib/config.ts**

```typescript
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface InfraConfig {
  storageBackend: "dynamodb" | "postgres";
  databaseUrl: string;
  domainName: string;
}

export function loadInfraConfig(): InfraConfig {
  const configPath = path.join(__dirname, "..", "config.yaml");
  const raw = fs.readFileSync(configPath, "utf-8");
  return yaml.load(raw) as InfraConfig;
}
```

**Step 5: Create infra/lib/static-site-stack.ts**

```typescript
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

export class StaticSiteStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: "/index.html",
          responseHttpStatus: 200,
        },
      ],
    });

    new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [s3deploy.Source.asset("../site/out")],
      destinationBucket: siteBucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "SiteUrl", {
      value: `https://${this.distribution.distributionDomainName}`,
    });
  }
}
```

**Step 6: Install dependencies**

```bash
cd infra && npm install
```

**Step 7: Commit**

```bash
git add infra/
git commit -m "feat: add CDK static site stack (S3 + CloudFront)"
```

---

### Task 8: CDK Infrastructure — API Stack

**Files:**
- Create: `infra/lib/api-stack.ts`
- Modify: `infra/bin/app.ts`

**Step 1: Create infra/lib/api-stack.ts**

```typescript
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import { InfraConfig } from "./config";

interface ApiStackProps extends cdk.StackProps {
  config: InfraConfig;
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { config } = props;

    // SNS Topic
    const signupTopic = new sns.Topic(this, "SignupTopic", {
      displayName: "Coming Soon Signup Notifications",
    });

    // DynamoDB Table (only if using dynamodb backend)
    let table: dynamodb.Table | undefined;
    if (config.storageBackend === "dynamodb") {
      table = new dynamodb.Table(this, "SignupsTable", {
        partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    // Lambda
    const signupHandler = new nodejs.NodejsFunction(this, "SignupHandler", {
      entry: "../lambda/handler.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: {
        STORAGE_BACKEND: config.storageBackend,
        SNS_TOPIC_ARN: signupTopic.topicArn,
        ...(config.storageBackend === "dynamodb" && table
          ? { TABLE_NAME: table.tableName }
          : {}),
        ...(config.storageBackend === "postgres"
          ? { DATABASE_URL: config.databaseUrl }
          : {}),
      },
      bundling: {
        externalModules: [],
      },
    });

    // Permissions
    signupTopic.grantPublish(signupHandler);
    if (table) {
      table.grantWriteData(signupHandler);
    }

    // API Gateway
    const api = new apigateway.RestApi(this, "SignupApi", {
      restApiName: "Coming Soon Signup API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["POST", "OPTIONS"],
        allowHeaders: ["Content-Type"],
      },
    });

    const signup = api.root.addResource("signup");
    signup.addMethod("POST", new apigateway.LambdaIntegration(signupHandler));

    this.apiUrl = api.url;

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
    });

    new cdk.CfnOutput(this, "SnsTopicArn", {
      value: signupTopic.topicArn,
    });
  }
}
```

**Step 2: Create infra/bin/app.ts**

```typescript
#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StaticSiteStack } from "../lib/static-site-stack";
import { ApiStack } from "../lib/api-stack";
import { loadInfraConfig } from "../lib/config";

const app = new cdk.App();
const config = loadInfraConfig();

new StaticSiteStack(app, "ComingSoonSite");
new ApiStack(app, "ComingSoonApi", { config });
```

**Step 3: Verify CDK synth**

```bash
cd infra && npx cdk synth --quiet
```

Expected: Synthesizes without errors (produces `cdk.out/`).

**Step 4: Commit**

```bash
git add infra/
git commit -m "feat: add CDK API stack (API Gateway, Lambda, DynamoDB, SNS)"
```

---

### Task 9: Final Wiring & README

**Files:**
- Create: `README.md`
- Verify full build pipeline works

**Step 1: Verify end-to-end build**

```bash
cd site && npm run build
cd ../lambda && npm test
cd ../infra && npx cdk synth --quiet
```

Expected: All three succeed.

**Step 2: Create README.md**

Minimal README covering:
- What the project is (1-2 sentences)
- Quick start (clone, edit configs, deploy)
- Config reference (both YAML files)
- Storage backend options
- SNS integration hook usage
- Project structure

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with quickstart and config reference"
```

---

## Summary

| Task | Description | Est. Steps |
|------|-------------|------------|
| 1 | Repo init & root config | 4 |
| 2 | Scaffold Next.js site | 12 |
| 3 | Frontend components | 6 |
| 4 | Repository interface + DynamoDB | 9 |
| 5 | Postgres repository | 5 |
| 6 | Lambda handler | 5 |
| 7 | CDK static site stack | 7 |
| 8 | CDK API stack | 4 |
| 9 | Final wiring & README | 3 |
