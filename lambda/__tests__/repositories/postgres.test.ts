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
      ["test@example.com", "2026-01-01T00:00:00Z", "127.0.0.1", null, null, null]
    );
  });

  it("includes verification fields when present", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const repo = new PostgresSignupRepository();
    await repo.saveSignup({
      email: "test@example.com",
      timestamp: "2026-01-01T00:00:00Z",
      ip: "127.0.0.1",
      verificationToken: "abc123",
      verificationTokenExpiry: "2026-01-02T00:00:00Z",
      verified: false,
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO signups"),
      [
        "test@example.com",
        "2026-01-01T00:00:00Z",
        "127.0.0.1",
        "abc123",
        "2026-01-02T00:00:00Z",
        false,
      ]
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

  describe("verifyEmail", () => {
    it("returns success when token is valid and unverified", async () => {
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ email: "test@example.com" }],
      });

      const repo = new PostgresSignupRepository();
      const result = await repo.verifyEmail("valid-token");

      expect(result).toEqual({ success: true, email: "test@example.com" });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE signups SET verified = TRUE"),
        ["valid-token"]
      );
    });

    it("returns success for already-verified token (idempotent)", async () => {
      // First query (UPDATE) returns no rows
      mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      // Second query (SELECT) finds it already verified
      mockQuery.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ email: "test@example.com" }],
      });

      const repo = new PostgresSignupRepository();
      const result = await repo.verifyEmail("already-verified-token");

      expect(result).toEqual({ success: true, email: "test@example.com", alreadyVerified: true });
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it("returns failure for expired or missing token", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const repo = new PostgresSignupRepository();
      const result = await repo.verifyEmail("bad-token");

      expect(result).toEqual({ success: false });
    });
  });
});
