import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { loadInfraConfig } from "../lib/config";

jest.mock("fs");
const mockReadFileSync = fs.readFileSync as jest.MockedFunction<
  typeof fs.readFileSync
>;

const VALID_YAML = `
storageBackend: dynamodb
databaseUrl: postgres://localhost:5432/mydb
domainName: example.com
`;

describe("loadInfraConfig", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("loads and parses infra config.yaml", () => {
    mockReadFileSync.mockReturnValue(VALID_YAML);

    const config = loadInfraConfig();

    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    expect(config.storageBackend).toBe("dynamodb");
    expect(config.databaseUrl).toBe("postgres://localhost:5432/mydb");
    expect(config.domainName).toBe("example.com");
  });

  it("defaults are correct in actual config.yaml on disk", () => {
    // Read the real config.yaml to verify defaults
    const realConfigPath = path.join(__dirname, "..", "config.yaml");
    const realContent = jest.requireActual("fs").readFileSync(realConfigPath, "utf-8");
    const realConfig = yaml.load(realContent) as Record<string, unknown>;

    expect(realConfig.storageBackend).toBe("dynamodb");
  });
});
