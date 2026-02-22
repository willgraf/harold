import { PostgresSignupRepository, _resetPool } from "../../repositories/postgres";

const mockQuery = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({ query: mockQuery })),
}));

describe("PostgresSignupRepository", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://localhost:5432/test";
    mockQuery.mockReset();
    _resetPool();
  });

  it("returns true for new signup", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const repo = new PostgresSignupRepository();
    const result = await repo.saveSignup({
      email: "test@example.com",
      timestamp: "2026-01-01T00:00:00Z",
      ip: "127.0.0.1",
    });

    expect(result).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO signups"),
      ["test@example.com", "2026-01-01T00:00:00Z", "127.0.0.1"]
    );
  });

  it("returns false for duplicate email", async () => {
    mockQuery.mockResolvedValue({ rowCount: 0 });

    const repo = new PostgresSignupRepository();
    const result = await repo.saveSignup({
      email: "test@example.com",
      timestamp: "2026-01-01T00:00:00Z",
      ip: "127.0.0.1",
    });

    expect(result).toBe(false);
  });

  it("throws if DATABASE_URL not set", () => {
    delete process.env.DATABASE_URL;
    expect(() => new PostgresSignupRepository()).toThrow();
  });

  it("reuses the same pool across instances", () => {
    const { Pool } = require("pg");
    Pool.mockClear();

    new PostgresSignupRepository();
    new PostgresSignupRepository();

    expect(Pool).toHaveBeenCalledTimes(1);
  });
});
