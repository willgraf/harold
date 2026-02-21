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

  it("saves a signup record", async () => {
    mockSend.mockResolvedValue({});

    const repo = new DynamoDBSignupRepository();
    await repo.saveSignup({
      email: "test@example.com",
      timestamp: "2026-01-01T00:00:00Z",
      ip: "127.0.0.1",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("throws if TABLE_NAME not set", () => {
    delete process.env.TABLE_NAME;
    expect(() => new DynamoDBSignupRepository()).toThrow();
  });
});
