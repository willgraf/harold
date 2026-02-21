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
