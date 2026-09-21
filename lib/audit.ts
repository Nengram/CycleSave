import type { Pool, PoolConnection } from "mysql2/promise";

/** Writes one line into audit_logs (the table nobody can edit or delete). */
export async function logAction(
  db: Pool | PoolConnection,
  e: {
    userId: number;
    groupId?: number | null;
    action: string;
    table: string;
    recordId?: number | null;
    req?: Request;
  }
) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, group_id, action, target_table, record_id)
       VALUES (?, ?, ?, ?, ?)`,
      [e.userId, e.groupId ?? null, e.action, e.table, e.recordId ?? null]
    );
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
