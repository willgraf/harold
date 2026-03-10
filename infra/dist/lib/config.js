"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadInfraConfig = loadInfraConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
function loadInfraConfig() {
    const configPath = path_1.default.join(__dirname, "..", "..", "config.yaml");
    const raw = fs_1.default.readFileSync(configPath, "utf-8");
    const data = js_yaml_1.default.load(raw);
    if (!data || !["dynamodb", "postgres"].includes(data.storageBackend)) {
        throw new Error('config.yaml: storageBackend must be "dynamodb" or "postgres"');
    }
    if (data.storageBackend === "postgres" && !data.databaseUrl) {
        throw new Error("config.yaml: databaseUrl is required when storageBackend is postgres");
    }
    const domainName = data.domainName || "";
    const certificateArn = data.certificateArn || "";
    if (domainName && !certificateArn) {
        throw new Error("config.yaml: certificateArn is required when domainName is set — create an ACM cert in us-east-1 first");
    }
    const evRaw = data.emailVerification || {};
    const emailVerification = {
        enabled: evRaw.enabled === true,
        senderEmail: evRaw.senderEmail || "",
        tokenExpiryHours: evRaw.tokenExpiryHours || 24,
    };
    if (emailVerification.enabled && !emailVerification.senderEmail) {
        throw new Error("config.yaml: emailVerification.senderEmail is required when emailVerification is enabled");
    }
    if (emailVerification.enabled && !data.siteUrl) {
        throw new Error("config.yaml: siteUrl is required when emailVerification is enabled");
    }
    return {
        ...data,
        domainName,
        certificateArn,
        siteUrl: data.siteUrl || "",
        brandName: data.brandName || "",
        emailVerification,
    };
}
