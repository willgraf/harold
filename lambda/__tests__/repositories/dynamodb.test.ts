import { DynamoDBSignupRepository } from "../../repositories/dynamodb";

const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(() => ({ send: mockSend })),
  PutItemCommand: jest.fn((input: unknown) => ({ input })),
}));

describe("DynamoDBSignupRepository", () => {
  beforeEach(() => {
    process.env.TABLE_NAME = "test-signups";
    mockSend.mockReset();
  });

  it("returns true for new signup", async () => {
    mockSend.mockResolvedValue({});

    const repo = new DynamoDBSignupRepository();
    const result = await repo.saveSignup({
      email: "test@example.com",
      timestamp: "2026-01-01T00:00:00Z",
      ip: "127.0.0.1",
    });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("returns false for duplicate email", async () => {
    const err = new Error("Conditional check failed");
    err.name = "ConditionalCheckFailedException";
    mockSend.mockRejectedValue(err);

    const repo = new DynamoDBSignupRepository();
    const result = await repo.saveSignup({
      email: "test@example.com",
      timestamp: "2026-01-01T00:00:00Z",
      ip: "127.0.0.1",
    });

    expect(result).toBe(false);
  });

  it("rethrows non-duplicate errors", async () => {
    mockSend.mockRejectedValue(new Error("Network error"));

    const repo = new DynamoDBSignupRepository();
    await expect(
      repo.saveSignup({
        email: "test@example.com",
        timestamp: "2026-01-01T00:00:00Z",
        ip: "127.0.0.1",
      })
    ).rejects.toThrow("Network error");
  });

  it("throws if TABLE_NAME not set", () => {
    delete process.env.TABLE_NAME;
    expect(() => new DynamoDBSignupRepository()).toThrow();
  });
});
