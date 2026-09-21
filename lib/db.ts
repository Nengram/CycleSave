import mysql, { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";

const g = globalThis as unknown as { _njangiPool?: Pool };

export const pool: Pool =
  g._njangiPool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "njangi_db",
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true, // DECIMAL columns come back as numbers
    dateStrings: true,    // DATE/DATETIME come back as strings
  });

if (process.env.NODE_ENV !== "production") g._njangiPool = pool;

export async function query(sql: string, params: unknown[] = []): Promise<RowDataPacket[]> {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return rows;
}

/** Runs fn inside a transaction: commit on success, rollback on any error. */
export async function tx<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}