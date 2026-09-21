import { handle, ok, need, readJson, ApiError } from "@/lib/http";
import { query, pool } from "@/lib/db";
import { groupContext, requireManage, GroupCtx } from "@/lib/access";
import { logAction } from "@/lib/audit";
import type { ResultSetHeader } from "mysql2/promise";

// Admin/treasurer: all penalties in the group. Member: only their own.
export const GET = handle(async (_req: Request, ctx: GroupCtx) => {
  const { gid, m } = await groupContext(ctx);
  return ok(
    await query(
      `SELECT pe.penalty_id, r.round_number, u.full_name, pt.type_name,
              pe.amount, pe.issued_at, pe.is_settled
         FROM penalties pe
         JOIN rounds r  ON r.round_id = pe.round_id
         JOIN cycles cy ON cy.cycle_id = r.cycle_id
         JOIN group_members gm ON gm.member_id = pe.member_id
         JOIN users u   ON u.user_id = gm.user_id
         JOIN penalty_types pt ON pt.penalty_type_id = pe.penalty_type_id
        WHERE cy.group_id = ? ${m.can_see_all ? "" : "AND pe.member_id = ?"}
        ORDER BY pe.issued_at DESC`,
      m.can_see_all ? [gid] : [gid, m.member_id]
    )
  );
});

// The admin marks a penalty as settled (the member has paid the fee).
// The subquery makes sure the penalty really belongs to THIS group.
export const PATCH = handle(async (req: Request, ctx: GroupCtx) => {
  const { session, gid, m } = await groupContext(ctx);
  requireManage(m);

  const b = await readJson<{ penaltyId: number }>(req);
  need(b.penaltyId, "penaltyId is required");

  const [r] = await pool.query<ResultSetHeader>(
    `UPDATE penalties SET is_settled = TRUE
      WHERE penalty_id = ?
        AND round_id IN (SELECT r.round_id FROM rounds r
                           JOIN cycles cy ON cy.cycle_id = r.cycle_id
                          WHERE cy.group_id = ?)`,
    [b.penaltyId, gid]
  );
  if (r.affectedRows === 0) throw new ApiError(404, "Penalty not found in this group");

  await logAction(pool, {
    userId: session.userId, groupId: gid, action: "SETTLE_PENALTY",
    table: "penalties", recordId: b.penaltyId, req,
  });
  return ok({ settled: true });
});
