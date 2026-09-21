import { handle, ok } from "@/lib/http";
import { query } from "@/lib/db";
import { groupContext, requireSeeAll, GroupCtx } from "@/lib/access";

// Treasury = admin / treasurer only. Ordinary members get 403.
export const GET = handle(async (_req: Request, ctx: GroupCtx) => {
  const { gid, m } = await groupContext(ctx);
  requireSeeAll(m);

  const [t] = await query("SELECT * FROM v_group_treasury WHERE group_id = ?", [gid]);

  const [pending] = await query(
    `SELECT COALESCE(SUM(pe.amount), 0) AS unsettled_penalties
       FROM penalties pe
       JOIN rounds r  ON r.round_id = pe.round_id
       JOIN cycles cy ON cy.cycle_id = r.cycle_id
      WHERE cy.group_id = ? AND pe.is_settled = FALSE`,
    [gid]
  );

  return ok({
    ...t,
    unsettled_penalties: pending.unsettled_penalties,
    balance: t.total_contributions - t.total_payouts + t.penalties_collected,
  });
});
