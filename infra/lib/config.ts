import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface EmailVerificationConfig {
  enabled: boolean;
  senderEmail: string;
  tokenExpiryHours: number;
}

export interface InfraConfig {
  storageBackend: "dynamodb" | "postgres";
  databaseUrl: string;
  domainName: string;
  certificateArn: string;
  siteUrl: string;
  brandName: string;
  emailVerification: EmailVerificationConfig;
}

export function loadInfraConfig(): InfraConfig {
  const configPath = path.join(__dirname, "..", "..", "config.yaml");
  const raw = fs.readFileSync(configPath, "utf-8");
  const data = yaml.load(raw) as Record<string, unknown>;
  if (!data || !["dynamodb", "postgres"].includes(data.storageBackend as string)) {
    throw new Error('config.yaml: storageBackend must be "dynamodb" or "postgres"');
  }

  // Sensitive values can be set via env vars to avoid committing them to git.
  // Env vars take precedence over config.yaml values.
  const databaseUrl = process.env.DATABASE_URL || (data.databaseUrl as string) || "";
  const certificateArn = process.env.CERTIFICATE_ARN || (data.certificateArn as string) || "";

  if (data.storageBackend === "postgres" && !databaseUrl) {
    throw new Error("databaseUrl is required when storageBackend is postgres — set DATABASE_URL env var or add it to config.yaml");
  }

  const domainName = (data.domainName as string) || "";

  if (domainName && !certificateArn) {
    throw new Error(
      "certificateArn is required when domainName is set — set CERTIFICATE_ARN env var or add it to config.yaml"
    );
  }

  const evRaw = (data.emailVerification as Record<string, unknown>) || {};
  const emailVerification: EmailVerificationConfig = {
    enabled: evRaw.enabled === true,
    senderEmail: (evRaw.senderEmail as string) || "",
    tokenExpiryHours: (evRaw.tokenExpiryHours as number) || 24,
  };

  if (emailVerification.enabled && !emailVerification.senderEmail) {
    throw new Error(
      "config.yaml: emailVerification.senderEmail is required when emailVerification is enabled"
    );
  }

  if (emailVerification.enabled && !data.siteUrl) {
    throw new Error(
      "config.yaml: siteUrl is required when emailVerification is enabled"
    );
  }

  return {
    ...data,
    databaseUrl,
    domainName,
    certificateArn,
    siteUrl: (data.siteUrl as string) || "",
    brandName: (data.brandName as string) || "",
    emailVerification,
  } as unknown as InfraConfig;
}
