import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
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

  async saveSignup(record: SignupRecord): Promise<void> {
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: {
          email: { S: record.email },
          timestamp: { S: record.timestamp },
          ip: { S: record.ip },
        },
        ConditionExpression: "attribute_not_exists(email)",
      })
    );
  }
}
