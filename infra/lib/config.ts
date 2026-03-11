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
  if (data.storageBackend === "postgres" && !data.databaseUrl) {
    throw new Error("config.yaml: databaseUrl is required when storageBackend is postgres");
  }

  const domainName = (data.domainName as string) || "";
  // CERTIFICATE_ARN env var takes precedence over config.yaml so the ARN
  // (which contains the AWS account ID) doesn't need to be committed to git.
  const certificateArn = process.env.CERTIFICATE_ARN || (data.certificateArn as string) || "";

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
    domainName,
    certificateArn,
    siteUrl: (data.siteUrl as string) || "",
    brandName: (data.brandName as string) || "",
    emailVerification,
  } as unknown as InfraConfig;
}
