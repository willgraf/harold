"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresSignupRepository = void 0;
exports._resetPool = _resetPool;
const pg_1 = require("pg");
let pool = null;
function getPool() {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error("DATABASE_URL environment variable is required");
        }
        pool = new pg_1.Pool({ connectionString });
    }
    return pool;
}
/** Reset the module-level pool. For testing only. */
function _resetPool() {
    pool = null;
}
class PostgresSignupRepository {
    pool;
    constructor() {
        this.pool = getPool();
    }
    async saveSignup(record) {
        const result = await this.pool.query("INSERT INTO signups (email, signed_up_at, ip, verification_token, verification_token_expiry, verified) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING", [
            record.email,
            record.timestamp,
            record.ip,
            record.verificationToken ?? null,
            record.verificationTokenExpiry ?? null,
            record.verified ?? null,
        ]);
        return (result.rowCount ?? 0) > 0;
    }
    async verifyEmail(token) {
        // Try to verify (atomic update)
        const result = await this.pool.query("UPDATE signups SET verified = TRUE WHERE verification_token = $1 AND verification_token_expiry > NOW() AND verified = FALSE RETURNING email", [token]);
        if ((result.rowCount ?? 0) > 0) {
            return { success: true, email: result.rows[0].email };
        }
        // Check if already verified (idempotent)
        const existing = await this.pool.query("SELECT email FROM signups WHERE verification_token = $1 AND verified = TRUE", [token]);
        if ((existing.rowCount ?? 0) > 0) {
            return { success: true, email: existing.rows[0].email, alreadyVerified: true };
        }
        return { success: false };
    }
}
exports.PostgresSignupRepository = PostgresSignupRepository;
