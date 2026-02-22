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
  const data = yaml.load(raw) as Record<string, unknown>;
  if (!data || !["dynamodb", "postgres"].includes(data.storageBackend as string)) {
    throw new Error('config.yaml: storageBackend must be "dynamodb" or "postgres"');
  }
  if (data.storageBackend === "postgres" && !data.databaseUrl) {
    throw new Error("config.yaml: databaseUrl is required when storageBackend is postgres");
  }
  return data as unknown as InfraConfig;
}
