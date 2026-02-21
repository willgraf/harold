jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(() => ({ send: jest.fn() })),
  PutItemCommand: jest.fn(),
}));

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({ query: jest.fn() })),
}));

describe("createRepository", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function loadCreateRepository() {
    const { createRepository } = require("../../repositories/index");
    return createRepository as () => import("../../repositories/index").SignupRepository;
  }

  it("defaults to DynamoDB when STORAGE_BACKEND is not set", () => {
    delete process.env.STORAGE_BACKEND;
    process.env.TABLE_NAME = "test-signups";

    const createRepository = loadCreateRepository();
    const repo = createRepository();
    const { DynamoDBSignupRepository } = require("../../repositories/dynamodb");

    expect(repo).toBeInstanceOf(DynamoDBSignupRepository);
  });

  it("returns DynamoDBSignupRepository when STORAGE_BACKEND=dynamodb", () => {
    process.env.STORAGE_BACKEND = "dynamodb";
    process.env.TABLE_NAME = "test-signups";

    const createRepository = loadCreateRepository();
    const repo = createRepository();
    const { DynamoDBSignupRepository } = require("../../repositories/dynamodb");

    expect(repo).toBeInstanceOf(DynamoDBSignupRepository);
  });

  it("returns PostgresSignupRepository when STORAGE_BACKEND=postgres", () => {
    process.env.STORAGE_BACKEND = "postgres";
    process.env.DATABASE_URL = "postgresql://localhost:5432/testdb";

    const createRepository = loadCreateRepository();
    const repo = createRepository();
    const { PostgresSignupRepository } = require("../../repositories/postgres");

    expect(repo).toBeInstanceOf(PostgresSignupRepository);
  });

  it("throws for unknown backend", () => {
    process.env.STORAGE_BACKEND = "redis";

    const createRepository = loadCreateRepository();

    expect(() => createRepository()).toThrow("Unknown storage backend: redis");
  });
});
