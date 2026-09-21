import { handle, ok } from "@/lib/http";
import { query } from "@/lib/db";
import { groupContext, requireManage, GroupCtx } from "@/lib/access";

// Audit trail of the group: admin only. Shows the latest 100 actions.
export const GET = handle(async (_req: Request, ctx: GroupCtx) => {
  const { gid, m } = await groupContext(ctx);
  requireManage(m);

  return ok(
    await query(
      `SELECT a.log_id, a.action, a.table_name, a.record_id, a.device_id, a.created_at, u.full_name
         FROM audit_logs a
         LEFT JOIN users u ON u.user_id = a.user_id
        WHERE a.group_id = ?
        ORDER BY a.log_id DESC
        LIMIT 100`,
      [gid]
    )
  );
});
