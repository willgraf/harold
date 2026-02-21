import { PostgresSignupRepository } from "../../repositories/postgres";

const mockQuery = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({ query: mockQuery })),
}));

describe("PostgresSignupRepository", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://localhost:5432/test";
    mockQuery.mockReset();
  });

  it("saves a signup record", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const repo = new PostgresSignupRepository();
    await repo.saveSignup({
      email: "test@example.com",
      timestamp: "2026-01-01T00:00:00Z",
      ip: "127.0.0.1",
    });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO signups"),
      ["test@example.com", "2026-01-01T00:00:00Z", "127.0.0.1"]
    );
  });

  it("throws if DATABASE_URL not set", () => {
    delete process.env.DATABASE_URL;
    expect(() => new PostgresSignupRepository()).toThrow();
  });
});
