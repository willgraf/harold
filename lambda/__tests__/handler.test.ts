const mockSaveSignup = jest.fn();
const mockVerifyEmail = jest.fn();
const mockPublish = jest.fn();
const mockSesSend = jest.fn();

jest.mock("../repositories/index", () => ({
  createRepository: () => ({
    saveSignup: mockSaveSignup,
    verifyEmail: mockVerifyEmail,
  }),
}));

jest.mock("@aws-sdk/client-sns", () => ({
  SNSClient: jest.fn(() => ({ send: mockPublish })),
  PublishCommand: jest.fn((input: unknown) => ({ input })),
}));

jest.mock("@aws-sdk/client-ses", () => ({
  SESClient: jest.fn(() => ({ send: mockSesSend })),
  SendEmailCommand: jest.fn((input: unknown) => ({ input })),
}));

jest.mock("../tokenUtils", () => ({
  generateVerificationToken: () => "test-verification-token",
  calculateTokenExpiry: () => "2026-01-02T00:00:00Z",
}));

import { handler } from "../handler";

describe("signup handler", () => {
  beforeEach(() => {
    process.env.SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:123456789:test-topic";
    process.env.STORAGE_BACKEND = "dynamodb";
    process.env.TABLE_NAME = "test-signups";
    process.env.EMAIL_VERIFICATION_ENABLED = "false";
    mockSaveSignup.mockReset();
    mockVerifyEmail.mockReset();
    mockPublish.mockReset();
    mockSesSend.mockReset();
  });

  it("returns 200 for valid new email", async () => {
    mockSaveSignup.mockResolvedValue(true);
    mockPublish.mockResolvedValue({});

    const event = {
      httpMethod: "POST",
      path: "/signup",
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
      httpMethod: "POST",
      path: "/signup",
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
      httpMethod: "POST",
      path: "/signup",
      body: JSON.stringify({}),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const event = {
      httpMethod: "POST",
      path: "/signup",
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
      httpMethod: "POST",
      path: "/signup",
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
    expect(result.headers!["Access-Control-Allow-Methods"]).toBe(
      "POST, GET, OPTIONS"
    );
  });

  it("returns 500 when repository throws", async () => {
    mockSaveSignup.mockRejectedValue(new Error("DB connection failed"));

    const event = {
      httpMethod: "POST",
      path: "/signup",
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe("Internal server error");
  });

  it("handles null body gracefully with 400", async () => {
    const event = {
      httpMethod: "POST",
      path: "/signup",
      body: null,
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(400);
  });

  it("handles malformed JSON body with 500", async () => {
    const event = {
      httpMethod: "POST",
      path: "/signup",
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
      httpMethod: "POST",
      path: "/signup",
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
      httpMethod: "POST",
      path: "/signup",
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(mockSaveSignup).toHaveBeenCalledTimes(1);
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("handles legacy POST without /signup path (backward compat)", async () => {
    mockSaveSignup.mockResolvedValue(true);
    mockPublish.mockResolvedValue({});

    const event = {
      httpMethod: "POST",
      path: "/",
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe("Success");
  });

  it("returns 404 for unknown GET route", async () => {
    const event = {
      httpMethod: "GET",
      path: "/unknown",
      requestContext: {},
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(404);
  });

  it("redirects with verified=false when verification is disabled and /verify is hit", async () => {
    process.env.SITE_URL = "https://example.com";

    const event = {
      httpMethod: "GET",
      path: "/verify",
      queryStringParameters: { token: "some-token" },
      requestContext: {},
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(302);
    expect(result.headers!.Location).toBe("https://example.com?verified=false");
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });
});

describe("signup with verification enabled", () => {
  beforeEach(() => {
    process.env.SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:123456789:test-topic";
    process.env.STORAGE_BACKEND = "dynamodb";
    process.env.TABLE_NAME = "test-signups";
    process.env.EMAIL_VERIFICATION_ENABLED = "true";
    process.env.EMAIL_SENDER = "noreply@example.com";
    process.env.API_URL = "https://api.example.com/";
    process.env.BRAND_NAME = "TestBrand";
    process.env.SITE_URL = "https://example.com";
    mockSaveSignup.mockReset();
    mockVerifyEmail.mockReset();
    mockPublish.mockReset();
    mockSesSend.mockReset();
  });

  it("sends SES email and returns verificationRequired", async () => {
    mockSaveSignup.mockResolvedValue(true);
    mockSesSend.mockResolvedValue({});

    const event = {
      httpMethod: "POST",
      path: "/signup",
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Verification email sent");
    expect(body.verificationRequired).toBe(true);
    expect(mockSesSend).toHaveBeenCalledTimes(1);
    expect(mockPublish).not.toHaveBeenCalled();

    // Validate SES payload
    const { SendEmailCommand } = require("@aws-sdk/client-ses");
    expect(SendEmailCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Source: "noreply@example.com",
        Destination: { ToAddresses: ["test@example.com"] },
        Message: expect.objectContaining({
          Subject: { Data: "Verify your email for TestBrand" },
          Body: {
            Html: {
              Data: expect.stringContaining(
                "https://api.example.com/verify?token="
              ),
            },
          },
        }),
      })
    );
  });

  it("saves signup with verification fields", async () => {
    mockSaveSignup.mockResolvedValue(true);
    mockSesSend.mockResolvedValue({});

    const event = {
      httpMethod: "POST",
      path: "/signup",
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    await handler(event as any);

    expect(mockSaveSignup).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        verificationToken: "test-verification-token",
        verificationTokenExpiry: "2026-01-02T00:00:00Z",
        verified: false,
      })
    );
  });

  it("returns Already registered for duplicate even with verification", async () => {
    mockSaveSignup.mockResolvedValue(false);

    const event = {
      httpMethod: "POST",
      path: "/signup",
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(JSON.parse(result.body).message).toBe("Already registered");
    expect(mockSesSend).not.toHaveBeenCalled();
  });

  it("still saves signup if SES fails", async () => {
    mockSaveSignup.mockResolvedValue(true);
    mockSesSend.mockRejectedValue(new Error("SES error"));

    const event = {
      httpMethod: "POST",
      path: "/signup",
      body: JSON.stringify({ email: "test@example.com" }),
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).verificationRequired).toBe(true);
    expect(mockSaveSignup).toHaveBeenCalledTimes(1);
  });
});

describe("verify endpoint", () => {
  beforeEach(() => {
    process.env.SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:123456789:test-topic";
    process.env.STORAGE_BACKEND = "dynamodb";
    process.env.TABLE_NAME = "test-signups";
    process.env.SITE_URL = "https://example.com";
    mockSaveSignup.mockReset();
    mockVerifyEmail.mockReset();
    mockPublish.mockReset();
    mockSesSend.mockReset();
  });

  it("redirects with verified=true on success", async () => {
    mockVerifyEmail.mockResolvedValue({
      success: true,
      email: "test@example.com",
    });
    mockPublish.mockResolvedValue({});

    const event = {
      httpMethod: "GET",
      path: "/verify",
      queryStringParameters: { token: "valid-token" },
      requestContext: {},
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(302);
    expect(result.headers!.Location).toBe("https://example.com?verified=true");
  });

  it("fires SNS on successful verification", async () => {
    mockVerifyEmail.mockResolvedValue({
      success: true,
      email: "test@example.com",
    });
    mockPublish.mockResolvedValue({});

    const event = {
      httpMethod: "GET",
      path: "/verify",
      queryStringParameters: { token: "valid-token" },
      requestContext: {},
    };

    await handler(event as any);

    expect(mockPublish).toHaveBeenCalledTimes(1);
  });

  it("redirects with verified=false on failure", async () => {
    mockVerifyEmail.mockResolvedValue({ success: false });

    const event = {
      httpMethod: "GET",
      path: "/verify",
      queryStringParameters: { token: "bad-token" },
      requestContext: {},
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(302);
    expect(result.headers!.Location).toBe(
      "https://example.com?verified=false"
    );
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("redirects with verified=false when no token provided", async () => {
    const event = {
      httpMethod: "GET",
      path: "/verify",
      queryStringParameters: {},
      requestContext: {},
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(302);
    expect(result.headers!.Location).toBe(
      "https://example.com?verified=false"
    );
  });

  it("redirects with verified=false when queryStringParameters is null", async () => {
    const event = {
      httpMethod: "GET",
      path: "/verify",
      queryStringParameters: null,
      requestContext: {},
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(302);
    expect(result.headers!.Location).toBe(
      "https://example.com?verified=false"
    );
  });

  it("rejects token with invalid characters", async () => {
    const event = {
      httpMethod: "GET",
      path: "/verify",
      queryStringParameters: { token: "<script>alert(1)</script>" },
      requestContext: {},
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(302);
    expect(result.headers!.Location).toBe(
      "https://example.com?verified=false"
    );
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });

  it("skips SNS for already-verified token (idempotent re-click)", async () => {
    mockVerifyEmail.mockResolvedValue({
      success: true,
      email: "test@example.com",
      alreadyVerified: true,
    });

    const event = {
      httpMethod: "GET",
      path: "/verify",
      queryStringParameters: { token: "already-verified-token" },
      requestContext: {},
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(302);
    expect(result.headers!.Location).toBe("https://example.com?verified=true");
    expect(mockPublish).not.toHaveBeenCalled();
  });
});
