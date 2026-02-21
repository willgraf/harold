export interface SignupRecord {
  email: string;
  timestamp: string;
  ip: string;
}

export interface SignupRepository {
  saveSignup(record: SignupRecord): Promise<boolean>;
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
