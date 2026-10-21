import { Pool, type PoolClient } from "pg";

const globalForPg = globalThis as unknown as { __aveMariaPgPool?: Pool };

/** Postgres undefined_table — schema not migrated yet. */
export function isMissingRelationError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "42P01"
  );
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example)."
    );
  }

  return new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    maxUses: 7500,
  });
}

export function getPool(): Pool {
  if (!globalForPg.__aveMariaPgPool) {
    globalForPg.__aveMariaPgPool = createPool();
  }
  return globalForPg.__aveMariaPgPool;
}

/** Neon-style tagged template helper on top of node-postgres. */
export const sql = Object.assign(
  async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let query = strings[0];
    for (let i = 0; i < values.length; i++) {
      query += `$${i + 1}` + strings[i + 1];
    }
    const result = await getPool().query(query, values);
    return result.rows;
  },
  {
    query: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      let query = strings[0];
      for (let i = 0; i < values.length; i++) {
        query += `$${i + 1}` + strings[i + 1];
      }
      const result = await getPool().query(query, values);
      return result.rows;
    },
  }
);

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}
