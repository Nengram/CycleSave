import { handle, ok, need, readJson, ApiError } from "@/lib/http";
import { query, tx } from "@/lib/db";
import { groupContext, GroupCtx } from "@/lib/access";
import { logAction } from "@/lib/audit";
import type { ResultSetHeader } from "mysql2/promise";

// Admin/treasurer: every contribution in the group. Ordinary member: ONLY their own.
export const GET = handle(async (_req: Request, ctx: GroupCtx) => {
  const { gid, m } = await groupContext(ctx);
  const rows = await query(
    `SELECT c.contribution_id, r.round_number, r.due_date, u.full_name, c.amount_paid,
            c.paid_at, c.momo_transaction_id, ps.status_name, mp.provider_name
       FROM contributions c
       JOIN rounds r  ON r.round_id = c.round_id
       JOIN cycles cy ON cy.cycle_id = r.cycle_id
       JOIN group_members gm ON gm.member_id = c.member_id
       JOIN users u   ON u.user_id = gm.user_id
       JOIN payment_statuses ps ON ps.status_id = c.status_id
       JOIN payment_accounts pa ON pa.account_id = c.account_id
       JOIN mobile_money_providers mp ON mp.provider_id = pa.provider_id
      WHERE cy.group_id = ? ${m.can_see_all ? "" : "AND c.member_id = ?"}
      ORDER BY r.due_date DESC, c.paid_at DESC`,
    m.can_see_all ? [gid] : [gid, m.member_id]
  );
  return ok(rows);
});

// A member pays THEIR OWN contribution.
// The amount comes from the group settings, never from the client.
// NOTE: in production the transactionId comes from the MoMo/Orange callback;
// here it is simulated and stored as "confirmed".
export const POST = handle(async (req: Request, ctx: GroupCtx) => {
  const { session, gid, m } = await groupContext(ctx);
  const b = await readJson<{ roundId: number; accountId: number; transactionId: string }>(req);
  need(b.roundId && b.accountId && b.transactionId?.trim(), "roundId, accountId and transactionId are required");

  const id = await tx(async (conn) => {
    // the round must belong to this group and be open; also work out if the payment is late
    const [[r]] = await conn.query<any[]>(
      `SELECT r.round_id, r.status, g.contribution_amount, g.late_fee_amount,
              (CURDATE() > DATE_ADD(r.due_date, INTERVAL g.grace_days DAY)) AS is_late
         FROM rounds r
         JOIN cycles cy       ON cy.cycle_id = r.cycle_id
         JOIN njangi_groups g ON g.group_id = cy.group_id
        WHERE r.round_id = ? AND cy.group_id = ?`,
      [b.roundId, gid]
    );
    if (!r) throw new ApiError(404, "Round not found in this group");
    if (r.status !== "open") throw new ApiError(409, "This round is not open for contributions");

    // the payment account must belong to the person paying
    const [[acc]] = await conn.query<any[]>(
      "SELECT account_id FROM payment_accounts WHERE account_id = ? AND user_id = ?",
      [b.accountId, session.userId]
    );
    if (!acc) throw new ApiError(400, "That payment account is not yours");

    const [c] = await conn.query<ResultSetHeader>(
      `INSERT INTO contributions
         (round_id, member_id, account_id, amount_paid, paid_at, momo_transaction_id, status_id)
       VALUES (?,?,?,?,NOW(),?,(SELECT status_id FROM payment_statuses WHERE status_name = 'confirmed'))`,
      [b.roundId, m.member_id, b.accountId, r.contribution_amount, b.transactionId.trim()]
    );

    // late = penalty + trust score down; on time = trust score up
    const [[pt]] = await conn.query<any[]>(
      "SELECT penalty_type_id, trust_penalty FROM penalty_types WHERE type_name = 'late_fee'"
    );
    if (r.is_late) {
      await conn.query(
        "INSERT INTO penalties (round_id, member_id, penalty_type_id, amount) VALUES (?,?,?,?)",
        [b.roundId, m.member_id, pt.penalty_type_id, r.late_fee_amount]
      );
      await conn.query(
        "INSERT INTO trust_score_events (user_id, round_id, points_change, reason) VALUES (?,?,?,?)",
        [session.userId, b.roundId, -pt.trust_penalty, "Late contribution"]
      );
    } else {
      await conn.query(
        "INSERT INTO trust_score_events (user_id, round_id, points_change, reason) VALUES (?,?,2,'On-time contribution')",
        [session.userId, b.roundId]
      );
    }

    await logAction(conn, {
      userId: session.userId, groupId: gid, action: "PAYMENT",
      table: "contributions", recordId: c.insertId, req,
    });
    return c.insertId;
  });

  return ok({ contributionId: id }, 201);
});
