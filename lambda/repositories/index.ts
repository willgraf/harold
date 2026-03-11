export interface SignupRecord {
  email: string;
  timestamp: string;
  ip: string;
  verificationToken?: string;
  verificationTokenExpiry?: string;
  verified?: boolean;
}

export interface SignupRepository {
  saveSignup(record: SignupRecord): Promise<boolean>;
  verifyEmail(token: string): Promise<{ success: boolean; email?: string; alreadyVerified?: boolean }>;
}

export function createRepository(): SignupRepository {
  const backend = process.env.STORAGE_BACKEND || "dynamodb";

  switch (backend) {
    case "dynamodb": {
      const { DynamoDBSignupRepository } = require("./dynamodb");
      return new DynamoDBSignupRepository();
    }
    case "postgres": {
      const { PostgresSignupRepository } = require("./postgres");
      return new PostgresSignupRepository();
    }
    default:
      throw new Error(`Unknown storage backend: ${backend}`);
  }
}
