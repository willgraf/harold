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

/** Resolves "$VAR_NAME" references to their environment variable values. */
function resolveEnvRef(configValue: unknown): string {
  const str = (configValue as string) || "";
  if (str.startsWith("$")) {
    return process.env[str.slice(1)] || "";
  }
  return str;
}

export function loadInfraConfig(): InfraConfig {
  const configPath = path.join(__dirname, "..", "..", "config.yaml");
  const raw = fs.readFileSync(configPath, "utf-8");
  const data = yaml.load(raw) as Record<string, unknown>;
  if (!data || !["dynamodb", "postgres"].includes(data.storageBackend as string)) {
    throw new Error('config.yaml: storageBackend must be "dynamodb" or "postgres"');
  }

  const databaseUrl = resolveEnvRef(data.databaseUrl);
  const certificateArn = resolveEnvRef(data.certificateArn);

  if (data.storageBackend === "postgres" && !databaseUrl) {
    throw new Error('databaseUrl is required when storageBackend is postgres — use databaseUrl: "$DATABASE_URL" in config.yaml');
  }

  const domainName = (data.domainName as string) || "";

  if (domainName && !certificateArn) {
    throw new Error(
      'certificateArn is required when domainName is set — use certificateArn: "$CERTIFICATE_ARN" in config.yaml'
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
