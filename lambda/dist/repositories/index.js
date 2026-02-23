"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRepository = createRepository;
function createRepository() {
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
