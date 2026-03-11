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
`;

describe("loadInfraConfig", () => {
  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.DATABASE_URL;
    delete process.env.CERTIFICATE_ARN;
  });

  it("loads and parses infra config.yaml", () => {
    mockReadFileSync.mockReturnValue(VALID_YAML);

    const config = loadInfraConfig();

    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    expect(config.storageBackend).toBe("dynamodb");
    expect(config.databaseUrl).toBe("postgres://localhost:5432/mydb");
  });

  it("throws for invalid storageBackend", () => {
    mockReadFileSync.mockReturnValue(`
storageBackend: redis
`);
    expect(() => loadInfraConfig()).toThrow('storageBackend must be "dynamodb" or "postgres"');
  });

  it("throws for postgres without databaseUrl", () => {
    mockReadFileSync.mockReturnValue(`
storageBackend: postgres
`);
    expect(() => loadInfraConfig()).toThrow("databaseUrl is required when storageBackend is postgres");
  });

  it("accepts postgres with literal databaseUrl", () => {
    mockReadFileSync.mockReturnValue(`
storageBackend: postgres
databaseUrl: postgres://localhost:5432/mydb
`);
    const config = loadInfraConfig();
    expect(config.storageBackend).toBe("postgres");
    expect(config.databaseUrl).toBe("postgres://localhost:5432/mydb");
  });

  it("resolves $VAR_NAME reference for databaseUrl", () => {
    process.env.DATABASE_URL = "postgres://envhost:5432/envdb";
    mockReadFileSync.mockReturnValue(`
storageBackend: postgres
databaseUrl: $DATABASE_URL
`);
    const config = loadInfraConfig();
    expect(config.databaseUrl).toBe("postgres://envhost:5432/envdb");
  });

  it("throws when domainName is set without certificateArn", () => {
    mockReadFileSync.mockReturnValue(`
storageBackend: dynamodb
domainName: example.com
`);
    expect(() => loadInfraConfig()).toThrow("certificateArn is required when domainName is set");
  });

  it("accepts domainName with literal certificateArn", () => {
    mockReadFileSync.mockReturnValue(`
storageBackend: dynamodb
domainName: example.com
certificateArn: arn:aws:acm:us-east-1:123456789012:certificate/abc-123
`);
    const config = loadInfraConfig();
    expect(config.domainName).toBe("example.com");
    expect(config.certificateArn).toBe("arn:aws:acm:us-east-1:123456789012:certificate/abc-123");
  });

  it("resolves $VAR_NAME reference for certificateArn", () => {
    process.env.CERTIFICATE_ARN = "arn:aws:acm:us-east-1:123456789012:certificate/env-cert";
    mockReadFileSync.mockReturnValue(`
storageBackend: dynamodb
domainName: example.com
certificateArn: $CERTIFICATE_ARN
`);
    const config = loadInfraConfig();
    expect(config.certificateArn).toBe("arn:aws:acm:us-east-1:123456789012:certificate/env-cert");
  });

  it("defaults emailVerification to disabled", () => {
    mockReadFileSync.mockReturnValue(VALID_YAML);

    const config = loadInfraConfig();

    expect(config.emailVerification.enabled).toBe(false);
    expect(config.emailVerification.senderEmail).toBe("");
    expect(config.emailVerification.tokenExpiryHours).toBe(24);
  });

  it("throws when emailVerification enabled without senderEmail", () => {
    mockReadFileSync.mockReturnValue(`
storageBackend: dynamodb
siteUrl: https://example.com
emailVerification:
  enabled: true
`);
    expect(() => loadInfraConfig()).toThrow(
      "emailVerification.senderEmail is required when emailVerification is enabled"
    );
  });

  it("throws when emailVerification enabled without siteUrl", () => {
    mockReadFileSync.mockReturnValue(`
storageBackend: dynamodb
emailVerification:
  enabled: true
  senderEmail: noreply@example.com
`);
    expect(() => loadInfraConfig()).toThrow(
      "siteUrl is required when emailVerification is enabled"
    );
  });

  it("accepts emailVerification enabled with senderEmail and siteUrl", () => {
    mockReadFileSync.mockReturnValue(`
storageBackend: dynamodb
siteUrl: https://example.com
brandName: TestBrand
emailVerification:
  enabled: true
  senderEmail: noreply@example.com
  tokenExpiryHours: 48
`);
    const config = loadInfraConfig();
    expect(config.emailVerification.enabled).toBe(true);
    expect(config.emailVerification.senderEmail).toBe("noreply@example.com");
    expect(config.emailVerification.tokenExpiryHours).toBe(48);
    expect(config.siteUrl).toBe("https://example.com");
    expect(config.brandName).toBe("TestBrand");
  });

  it("defaults siteUrl and brandName to empty strings", () => {
    mockReadFileSync.mockReturnValue(VALID_YAML);
    const config = loadInfraConfig();
    expect(config.siteUrl).toBe("");
    expect(config.brandName).toBe("");
  });

  it("defaults are correct in actual config.yaml on disk", () => {
    const realConfigPath = path.join(__dirname, "..", "config.yaml");
    const realContent = jest.requireActual("fs").readFileSync(realConfigPath, "utf-8");
    const realConfig = yaml.load(realContent) as Record<string, unknown>;

    expect(realConfig.storageBackend).toBe("dynamodb");
  });
});
