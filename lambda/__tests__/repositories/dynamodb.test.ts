import { DynamoDBSignupRepository } from "../../repositories/dynamodb";

const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(() => ({ send: mockSend })),
  PutItemCommand: jest.fn((input: unknown) => ({ _type: "PutItem", input })),
  QueryCommand: jest.fn((input: unknown) => ({ _type: "Query", input })),
  UpdateItemCommand: jest.fn((input: unknown) => ({ _type: "Update", input })),
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

  it("includes verification fields when present", async () => {
    mockSend.mockResolvedValue({});
    const { PutItemCommand } = require("@aws-sdk/client-dynamodb");

    const repo = new DynamoDBSignupRepository();
    await repo.saveSignup({
      email: "test@example.com",
      timestamp: "2026-01-01T00:00:00Z",
      ip: "127.0.0.1",
      verificationToken: "abc123",
      verificationTokenExpiry: "2026-01-02T00:00:00Z",
      verified: false,
    });

    expect(PutItemCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Item: expect.objectContaining({
          verificationToken: { S: "abc123" },
          verificationTokenExpiry: { S: "2026-01-02T00:00:00Z" },
          verified: { BOOL: false },
        }),
      })
    );
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

  describe("verifyEmail", () => {
    it("returns success for valid token", async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      mockSend
        .mockResolvedValueOnce({
          Items: [
            {
              email: { S: "test@example.com" },
              timestamp: { S: "2026-01-01T00:00:00Z" },
              verificationToken: { S: "valid-token" },
              verificationTokenExpiry: { S: futureDate },
              verified: { BOOL: false },
            },
          ],
        })
        .mockResolvedValueOnce({});

      const repo = new DynamoDBSignupRepository();
      const result = await repo.verifyEmail("valid-token");

      expect(result).toEqual({ success: true, email: "test@example.com" });
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("returns failure for expired token", async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            email: { S: "test@example.com" },
            timestamp: { S: "2026-01-01T00:00:00Z" },
            verificationToken: { S: "expired-token" },
            verificationTokenExpiry: { S: pastDate },
            verified: { BOOL: false },
          },
        ],
      });

      const repo = new DynamoDBSignupRepository();
      const result = await repo.verifyEmail("expired-token");

      expect(result).toEqual({ success: false });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("returns failure for missing token", async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const repo = new DynamoDBSignupRepository();
      const result = await repo.verifyEmail("nonexistent-token");

      expect(result).toEqual({ success: false });
    });

    it("returns success without update for already-verified token", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            email: { S: "test@example.com" },
            timestamp: { S: "2026-01-01T00:00:00Z" },
            verificationToken: { S: "verified-token" },
            verificationTokenExpiry: { S: "2026-01-02T00:00:00Z" },
            verified: { BOOL: true },
          },
        ],
      });

      const repo = new DynamoDBSignupRepository();
      const result = await repo.verifyEmail("verified-token");

      expect(result).toEqual({ success: true, email: "test@example.com", alreadyVerified: true });
      // Should NOT send an UpdateItemCommand
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("handles concurrent verification race condition gracefully", async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const condErr = new Error("Condition not met");
      condErr.name = "ConditionalCheckFailedException";

      mockSend
        .mockResolvedValueOnce({
          Items: [
            {
              email: { S: "test@example.com" },
              timestamp: { S: "2026-01-01T00:00:00Z" },
              verificationToken: { S: "race-token" },
              verificationTokenExpiry: { S: futureDate },
              verified: { BOOL: false },
            },
          ],
        })
        .mockRejectedValueOnce(condErr);

      const repo = new DynamoDBSignupRepository();
      const result = await repo.verifyEmail("race-token");

      // Should still return success (another request verified it first)
      expect(result).toEqual({ success: true, email: "test@example.com", alreadyVerified: true });
    });

    it("returns failure when item is missing email field", async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            timestamp: { S: "2026-01-01T00:00:00Z" },
            verificationToken: { S: "token" },
            verificationTokenExpiry: { S: futureDate },
            verified: { BOOL: false },
          },
        ],
      });

      const repo = new DynamoDBSignupRepository();
      const result = await repo.verifyEmail("token");

      expect(result).toEqual({ success: false });
    });
  });
});
