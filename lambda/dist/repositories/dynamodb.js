"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBSignupRepository = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
class DynamoDBSignupRepository {
    client;
    tableName;
    constructor() {
        const tableName = process.env.TABLE_NAME;
        if (!tableName) {
            throw new Error("TABLE_NAME environment variable is required");
        }
        this.tableName = tableName;
        this.client = new client_dynamodb_1.DynamoDBClient({});
    }
    async saveSignup(record) {
        try {
            const item = {
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
            await this.client.send(new client_dynamodb_1.PutItemCommand({
                TableName: this.tableName,
                Item: item,
                ConditionExpression: "attribute_not_exists(email)",
            }));
            return true;
        }
        catch (err) {
            if (typeof err === "object" &&
                err !== null &&
                "name" in err &&
                err.name === "ConditionalCheckFailedException") {
                return false;
            }
            throw err;
        }
    }
    async verifyEmail(token) {
        // Query the GSI to find the signup by verification token
        const queryResult = await this.client.send(new client_dynamodb_1.QueryCommand({
            TableName: this.tableName,
            IndexName: "VerificationTokenIndex",
            KeyConditionExpression: "verificationToken = :token",
            ExpressionAttributeValues: {
                ":token": { S: token },
            },
        }));
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
            await this.client.send(new client_dynamodb_1.UpdateItemCommand({
                TableName: this.tableName,
                Key: {
                    email: { S: email },
                    timestamp: { S: timestamp },
                },
                UpdateExpression: "SET verified = :v",
                ConditionExpression: "verified = :false OR attribute_not_exists(verified)",
                ExpressionAttributeValues: {
                    ":v": { BOOL: true },
                    ":false": { BOOL: false },
                },
            }));
        }
        catch (err) {
            if (typeof err === "object" &&
                err !== null &&
                "name" in err &&
                err.name === "ConditionalCheckFailedException") {
                // Already verified by a concurrent request
                return { success: true, email, alreadyVerified: true };
            }
            throw err;
        }
        return { success: true, email };
    }
}
exports.DynamoDBSignupRepository = DynamoDBSignupRepository;
