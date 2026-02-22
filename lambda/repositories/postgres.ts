import { Pool } from "pg";
import { SignupRecord, SignupRepository } from "./index";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

/** Reset the module-level pool. For testing only. */
export function _resetPool(): void {
  pool = null;
}

export class PostgresSignupRepository implements SignupRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async saveSignup(record: SignupRecord): Promise<boolean> {
    const result = await this.pool.query(
      "INSERT INTO signups (email, signed_up_at, ip) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
      [record.email, record.timestamp, record.ip]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
