import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { SignupRecord, SignupRepository } from "./index";

export class DynamoDBSignupRepository implements SignupRepository {
  private client: DynamoDBClient;
  private tableName: string;

  constructor() {
    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      throw new Error("TABLE_NAME environment variable is required");
    }
    this.tableName = tableName;
    this.client = new DynamoDBClient({});
  }

  async saveSignup(record: SignupRecord): Promise<boolean> {
    try {
      const item: Record<string, { S: string } | { BOOL: boolean }> = {
        email: { S: record.email },
        timestamp: { S: record.timestamp },
        ip: { S: record.ip },
      };

      if (record.verificationToken) {
        item.verificationToken = { S: record.verificationToken };
      }
      if (record.verificationTokenExpiry) {
        item.verificationTokenExpiry = { S: record.verificationTokenExpiry };
      }
      if (record.verified !== undefined) {
        item.verified = { BOOL: record.verified };
      }

      await this.client.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: item,
          ConditionExpression: "attribute_not_exists(email)",
        })
      );
      return true;
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        (err as { name: string }).name === "ConditionalCheckFailedException"
      ) {
        return false;
      }
      throw err;
    }
  }

  async verifyEmail(
    token: string
  ): Promise<{ success: boolean; email?: string; alreadyVerified?: boolean }> {
    // Query the GSI to find the signup by verification token
    const queryResult = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "VerificationTokenIndex",
        KeyConditionExpression: "verificationToken = :token",
        ExpressionAttributeValues: {
          ":token": { S: token },
        },
      })
    );

    const items = queryResult.Items;
    if (!items || items.length === 0) {
      return { success: false };
    }

    const item = items[0];
    const email = item.email?.S;
    const timestamp = item.timestamp?.S;
    const expiry = item.verificationTokenExpiry?.S;
    const alreadyVerified = item.verified?.BOOL;

    if (!email || !timestamp) {
      return { success: false };
    }

    // Idempotent: already verified is still success, but flag it
    if (alreadyVerified) {
      return { success: true, email, alreadyVerified: true };
    }

    // Check expiry
    if (!expiry || new Date(expiry) < new Date()) {
      return { success: false };
    }

    // Mark as verified with condition to prevent duplicate SNS from race conditions
    try {
      await this.client.send(
        new UpdateItemCommand({
          TableName: this.tableName,
          Key: {
            email: { S: email },
            timestamp: { S: timestamp },
          },
          UpdateExpression: "SET verified = :v",
          ConditionExpression:
            "verified = :false OR attribute_not_exists(verified)",
          ExpressionAttributeValues: {
            ":v": { BOOL: true },
            ":false": { BOOL: false },
          },
        })
      );
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        (err as { name: string }).name === "ConditionalCheckFailedException"
      ) {
        // Already verified by a concurrent request
        return { success: true, email, alreadyVerified: true };
      }
      throw err;
    }

    return { success: true, email };
  }
}
