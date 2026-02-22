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

  it("returns 200 for valid new email", async () => {
    mockSaveSignup.mockResolvedValue(true);
    mockPublish.mockResolvedValue({});

    const event = {
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe("Success");
    expect(mockSaveSignup).toHaveBeenCalledTimes(1);
    expect(mockPublish).toHaveBeenCalledTimes(1);
  });

  it("returns 200 with 'Already registered' for duplicate email", async () => {
    mockSaveSignup.mockResolvedValue(false);

    const event = {
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe("Already registered");
    expect(mockPublish).not.toHaveBeenCalled();
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
    mockSaveSignup.mockResolvedValue(true);
    mockPublish.mockResolvedValue({});

    const event = {
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.headers!["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("OPTIONS preflight returns 200 with CORS headers", async () => {
    const event = {
      httpMethod: "OPTIONS",
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(result.headers!["Access-Control-Allow-Origin"]).toBe("*");
    expect(result.headers!["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
  });

  it("returns 500 when repository throws", async () => {
    mockSaveSignup.mockRejectedValue(new Error("DB connection failed"));

    const event = {
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe("Internal server error");
  });

  it("handles null body gracefully with 400", async () => {
    const event = {
      body: null,
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(400);
  });

  it("handles malformed JSON body with 500", async () => {
    const event = {
      body: "not json",
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe("Internal server error");
  });

  it("returns 200 when SNS publish fails", async () => {
    mockSaveSignup.mockResolvedValue(true);
    mockPublish.mockRejectedValue(new Error("SNS timeout"));

    const event = {
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe("Success");
    expect(mockSaveSignup).toHaveBeenCalledTimes(1);
  });

  it("skips SNS when no topic ARN is set", async () => {
    delete process.env.SNS_TOPIC_ARN;
    mockSaveSignup.mockResolvedValue(true);

    const event = {
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(mockSaveSignup).toHaveBeenCalledTimes(1);
    expect(mockPublish).not.toHaveBeenCalled();
  });
});
