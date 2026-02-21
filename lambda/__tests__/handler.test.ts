const mockSaveSignup = jest.fn();
const mockPublish = jest.fn();

jest.mock("../repositories/index", () => ({
  createRepository: () => ({ saveSignup: mockSaveSignup }),
}));

jest.mock("@aws-sdk/client-sns", () => ({
  SNSClient: jest.fn(() => ({ send: mockPublish })),
  PublishCommand: jest.fn((input: unknown) => ({ input })),
}));

import { handler } from "../handler";

describe("signup handler", () => {
  beforeEach(() => {
    process.env.SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:123456789:test-topic";
    process.env.STORAGE_BACKEND = "dynamodb";
    process.env.TABLE_NAME = "test-signups";
    mockSaveSignup.mockReset();
    mockPublish.mockReset();
  });

  it("returns 200 for valid email", async () => {
    mockSaveSignup.mockResolvedValue(undefined);
    mockPublish.mockResolvedValue({});

    const event = {
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(mockSaveSignup).toHaveBeenCalledTimes(1);
    expect(mockPublish).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for missing email", async () => {
    const event = {
      body: JSON.stringify({}),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const event = {
      body: JSON.stringify({ email: "not-an-email" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(400);
  });

  it("returns CORS headers", async () => {
    mockSaveSignup.mockResolvedValue(undefined);
    mockPublish.mockResolvedValue({});

    const event = {
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.headers!["Access-Control-Allow-Origin"]).toBe("*");
  });
});
