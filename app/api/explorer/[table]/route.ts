import { handle, ok, ApiError } from "@/lib/http";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { TABLES } from "@/lib/tables";

// Read-only view of ONE table: its columns, keys, foreign keys and first 200 rows.
export const GET = handle(
  async (_req: Request, ctx: { params: Promise<{ table: string }> }) => {
    await requireSession();
    if (process.env.EXPLORER_ENABLED !== "true")
      throw new ApiError(403, "Database explorer is disabled");

    const { table } = await ctx.params;
    // whitelist check: the table name is never taken from the client blindly (prevents SQL injection)
    if (!(TABLES as readonly string[]).includes(table))
      throw new ApiError(404, "Unknown table");

    const columns = await query(
      `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable, COLUMN_KEY AS keyType
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION`,
      [table]
    );

    const foreignKeys = await query(
      `SELECT COLUMN_NAME AS col, REFERENCED_TABLE_NAME AS refTable, REFERENCED_COLUMN_NAME AS refCol
         FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [table]
    );

    // hide password hashes and mask national IDs before sending rows to the browser
    const rows = (await query(`SELECT * FROM \`${table}\` LIMIT 200`)).map((r) => {
      const row: Record<string, unknown> = { ...r };
      delete row.password_hash;
      if (typeof row.nin === "string") row.nin = "****" + row.nin.slice(-3);
      return row;
    });

    return ok({
      table,
      columns: columns.filter((c) => c.name !== "password_hash"),
      foreignKeys,
      rows,
    });
  }
);
