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
