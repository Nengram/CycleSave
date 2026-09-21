import { handle, ok, need, readJson, ApiError } from "@/lib/http";
import { query, tx } from "@/lib/db";
import { groupContext, requireManage, GroupCtx } from "@/lib/access";
import { logAction } from "@/lib/audit";
import type { ResultSetHeader } from "mysql2/promise";

// Admin/treasurer: all payouts. Member: only the payout THEY received.
export const GET = handle(async (_req: Request, ctx: GroupCtx) => {
  const { gid, m } = await groupContext(ctx);
  return ok(
    await query(
      `SELECT p.payout_id, r.round_number, u.full_name AS collector, p.amount_collected,
              p.paid_at, p.momo_transaction_id, ps.status_name
         FROM payouts p
         JOIN rounds r  ON r.round_id = p.round_id
         JOIN cycles cy ON cy.cycle_id = r.cycle_id
         JOIN group_members gm ON gm.member_id = p.member_id
         JOIN users u   ON u.user_id = gm.user_id
         JOIN payment_statuses ps ON ps.status_id = p.status_id
        WHERE cy.group_id = ? ${m.can_see_all ? "" : "AND p.member_id = ?"}
        ORDER BY p.paid_at DESC`,
      m.can_see_all ? [gid] : [gid, m.member_id]
    )
  );
});

// The admin releases the pot of a round to that round's collector.
// Every member must have contributed. The MySQL trigger blocks members with 2+ unsettled penalties.
export const POST = handle(async (req: Request, ctx: GroupCtx) => {
  const { session, gid, m } = await groupContext(ctx);
  requireManage(m);

  const b = await readJson<{ roundId: number; transactionId: string }>(req);
  need(b.roundId && b.transactionId?.trim(), "roundId and transactionId are required");

  const id = await tx(async (conn) => {
    // who collects this round (derived from rotation_positions through the view)
    const [[s]] = await conn.query<any[]>(
      "SELECT * FROM v_round_schedule WHERE round_id = ? AND group_id = ?",
      [b.roundId, gid]
    );
    if (!s) throw new ApiError(404, "Round not found in this group");
    if (s.round_status !== "open") throw new ApiError(409, "This round is not open");

    // has everybody paid?
    const [[cnt]] = await conn.query<any[]>(
      "SELECT COUNT(*) AS n FROM group_members WHERE group_id = ? AND status = 'active'",
      [gid]
    );
    const [[pot]] = await conn.query<any[]>(
      "SELECT COUNT(*) AS n, COALESCE(SUM(amount_paid), 0) AS total FROM contributions WHERE round_id = ? AND status_id = 2",
      [b.roundId]
    );
    if (pot.n < cnt.n) throw new ApiError(409, `Only ${pot.n} of ${cnt.n} members have contributed`);

    // pay to the collector's default mobile money account
    const [[acc]] = await conn.query<any[]>(
      "SELECT account_id FROM payment_accounts WHERE user_id = ? ORDER BY is_default DESC LIMIT 1",
      [s.collector_user_id]
    );
    if (!acc) throw new ApiError(409, "The collector has no mobile money account");

    const [p] = await conn.query<ResultSetHeader>(
      `INSERT INTO payouts
         (round_id, member_id, account_id, amount_collected, paid_at, momo_transaction_id, status_id)
       VALUES (?,?,?,?,NOW(),?,(SELECT status_id FROM payment_statuses WHERE status_name = 'confirmed'))`,
      [b.roundId, s.collector_member_id, acc.account_id, pot.total, b.transactionId.trim()]
    );

    // close this round and open the next one; if there is no next round, the cycle is complete
    await conn.query("UPDATE rounds SET status = 'closed' WHERE round_id = ?", [b.roundId]);
    const [nx] = await conn.query<ResultSetHeader>(
      "UPDATE rounds SET status = 'open' WHERE cycle_id = ? AND round_number = ? AND status = 'pending'",
      [s.cycle_id, s.round_number + 1]
    );
    if (nx.affectedRows === 0) {
      await conn.query(
        "UPDATE cycles SET status = 'completed', end_date = CURDATE() WHERE cycle_id = ?",
        [s.cycle_id]
      );
    }

    await logAction(conn, {
      userId: session.userId, groupId: gid, action: "PAYOUT",
      table: "payouts", recordId: p.insertId, req,
    });
    return p.insertId;
  });

  return ok({ payoutId: id }, 201);
});
