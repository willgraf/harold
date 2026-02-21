import { Pool } from "pg";
import { SignupRecord, SignupRepository } from "./index";

export class PostgresSignupRepository implements SignupRepository {
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    this.pool = new Pool({ connectionString });
  }

  async saveSignup(record: SignupRecord): Promise<boolean> {
    const result = await this.pool.query(
      "INSERT INTO signups (email, signed_up_at, ip) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
      [record.email, record.timestamp, record.ip]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
