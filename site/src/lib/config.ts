import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface Feature {
  title: string;
  description: string;
  icon: string;
}

export interface SiteConfig {
  brandName: string;
  tagline: string;
  headline: string;
  description: string;
  ctaText: string;
  successMessage: string;
  verificationPendingMessage: string;
  verificationSuccessMessage: string;
  features: Feature[];
  socialProof: {
    line1: string;
    line2: string;
  };
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  logoUrl: string | null;
  apiUrl: string;
}

const defaults: Partial<SiteConfig> = {
  headline: "",
  description: "",
  verificationPendingMessage: "Check your email to confirm your spot.",
  verificationSuccessMessage: "You're confirmed! We'll be in touch.",
  features: [],
  socialProof: { line1: "", line2: "" },
  colors: {
    primary: "#D4593C",
    accent: "#E8A84C",
    background: "#09090B",
    surface: "#13131A",
    text: "#EDE9E1",
    textMuted: "#7A756E",
  },
  fonts: {
    display: "DM Serif Display",
    body: "Instrument Sans",
  },
};

export function loadConfig(): SiteConfig {
  const configPath = path.join(process.cwd(), "config.yaml");
  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = yaml.load(raw) as Record<string, unknown>;
  return {
    ...defaults,
    ...parsed,
    colors: { ...defaults.colors, ...(parsed.colors as Record<string, unknown>) },
    fonts: { ...defaults.fonts, ...(parsed.fonts as Record<string, unknown>) },
    socialProof: { ...defaults.socialProof, ...(parsed.socialProof as Record<string, unknown>) },
  } as SiteConfig;
}
