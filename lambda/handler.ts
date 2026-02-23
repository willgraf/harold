import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { createRepository } from "./repositories/index";
import { generateVerificationToken, calculateTokenExpiry } from "./tokenUtils";
import { generateVerificationEmail } from "./emailTemplates";

const repository = createRepository();
const sns = new SNSClient({});
const ses = new SESClient({});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function response(statusCode: number, body: object): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

function redirect(url: string): APIGatewayProxyResult {
  return {
    statusCode: 302,
    headers: {
      ...corsHeaders,
      Location: url,
    },
    body: "",
  };
}

async function publishSns(email: string, timestamp: string): Promise<void> {
  const topicArn = process.env.SNS_TOPIC_ARN;
  if (topicArn) {
    try {
      await sns.send(
        new PublishCommand({
          TopicArn: topicArn,
          Message: JSON.stringify({ email, timestamp, source: "harold" }),
        })
      );
    } catch (snsErr) {
      console.error("SNS publish failed (signup saved):", snsErr);
    }
  }
}

async function handleSignup(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "{}");
  const email: string | undefined = body.email;

  if (!email || !EMAIL_REGEX.test(email)) {
    return response(400, { message: "Valid email is required" });
  }

  const timestamp = new Date().toISOString();
  const ip = event.requestContext?.identity?.sourceIp || "unknown";
  const verificationEnabled =
    process.env.EMAIL_VERIFICATION_ENABLED === "true";

  if (verificationEnabled) {
    const token = generateVerificationToken();
    const expiryHours = parseInt(
      process.env.EMAIL_VERIFICATION_EXPIRY_HOURS || "24",
      10
    );
    const tokenExpiry = calculateTokenExpiry(expiryHours);

    const isNew = await repository.saveSignup({
      email,
      timestamp,
      ip,
      verificationToken: token,
      verificationTokenExpiry: tokenExpiry,
      verified: false,
    });

    if (!isNew) {
      return response(200, { message: "Already registered" });
    }

    // Send verification email via SES
    const apiUrl = process.env.API_URL || "";
    const brandName = process.env.BRAND_NAME || "Harold";
    const senderEmail = process.env.EMAIL_SENDER || "";
    const verificationUrl = `${apiUrl}verify?token=${encodeURIComponent(token)}`;

    try {
      await ses.send(
        new SendEmailCommand({
          Source: senderEmail,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: `Verify your email for ${brandName}` },
            Body: {
              Html: {
                Data: generateVerificationEmail(verificationUrl, brandName, expiryHours),
              },
            },
          },
        })
      );
    } catch (sesErr) {
      console.error("SES send failed (signup saved):", sesErr);
    }

    return response(200, {
      message: "Verification email sent",
      verificationRequired: true,
    });
  }

  // Verification disabled — existing flow
  const isNew = await repository.saveSignup({ email, timestamp, ip });

  if (!isNew) {
    return response(200, { message: "Already registered" });
  }

  await publishSns(email, timestamp);

  return response(200, { message: "Success" });
}

async function handleVerify(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const siteUrl = process.env.SITE_URL || "";

  if (process.env.EMAIL_VERIFICATION_ENABLED !== "true") {
    return redirect(`${siteUrl}?verified=false`);
  }

  const token = event.queryStringParameters?.token;

  if (!token || token.length > 100 || !/^[A-Za-z0-9_-]+$/.test(token)) {
    return redirect(`${siteUrl}?verified=false`);
  }

  const result = await repository.verifyEmail(token);

  if (result.success && result.email) {
    if (!result.alreadyVerified) {
      await publishSns(result.email, new Date().toISOString());
    }
    return redirect(`${siteUrl}?verified=true`);
  }

  return redirect(`${siteUrl}?verified=false`);
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }

  try {
    const path = event.path || "";

    if (event.httpMethod === "POST" && path.endsWith("/signup")) {
      return await handleSignup(event);
    }

    if (event.httpMethod === "GET" && path.endsWith("/verify")) {
      return await handleVerify(event);
    }

    // Legacy: POST without specific path (backward compat for existing tests/deployments)
    if (event.httpMethod === "POST" && !path.includes("/verify")) {
      return await handleSignup(event);
    }

    return response(404, { message: "Not found" });
  } catch (err) {
    console.error("Handler error:", err);
    return response(500, { message: "Internal server error" });
  }
}
