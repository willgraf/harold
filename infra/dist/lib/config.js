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
    const configPath = path_1.default.join(__dirname, "..", "config.yaml");
    const raw = fs_1.default.readFileSync(configPath, "utf-8");
    const data = js_yaml_1.default.load(raw);
    if (!data || !["dynamodb", "postgres"].includes(data.storageBackend)) {
        throw new Error('config.yaml: storageBackend must be "dynamodb" or "postgres"');
    }
    if (data.storageBackend === "postgres" && !data.databaseUrl) {
        throw new Error("config.yaml: databaseUrl is required when storageBackend is postgres");
    }
    return data;
}
