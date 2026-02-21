import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { createRepository } from "./repositories/index";

const repository = createRepository();
const sns = new SNSClient({});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(statusCode: number, body: object): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const email: string | undefined = body.email;

    if (!email || !EMAIL_REGEX.test(email)) {
      return response(400, { message: "Valid email is required" });
    }

    const timestamp = new Date().toISOString();
    const ip = event.requestContext?.identity?.sourceIp || "unknown";

    const isNew = await repository.saveSignup({ email, timestamp, ip });

    if (!isNew) {
      return response(200, { message: "Already registered" });
    }

    const topicArn = process.env.SNS_TOPIC_ARN;
    if (topicArn) {
      await sns.send(
        new PublishCommand({
          TopicArn: topicArn,
          Message: JSON.stringify({ email, timestamp, source: "harold" }),
        })
      );
    }

    return response(200, { message: "Success" });
  } catch (err) {
    console.error("Signup error:", err);
    return response(500, { message: "Internal server error" });
  }
}
