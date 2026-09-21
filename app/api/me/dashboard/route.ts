import { handle, ok } from "@/lib/http";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

// Everything on this page concerns ONLY the logged-in user.
export const GET = handle(async () => {
  const s = await requireSession();

  // 1. My trust score (computed by a view, not stored)
  const [trust] = await query(
    "SELECT trust_score FROM v_user_trust_score WHERE user_id = ?",
    [s.userId]
  );

  // 2. What I have to pay now: the open round of each of my groups, and whether I already paid it
  const dues = await query(
    `SELECT g.group_id, g.group_name, gr.role_name, r.round_id, r.round_number, r.due_date,
            g.contribution_amount,
            EXISTS(SELECT 1 FROM contributions c
                    WHERE c.round_id = r.round_id AND c.member_id = gm.member_id) AS paid
       FROM group_members gm
       JOIN njangi_groups g ON g.group_id = gm.group_id
       JOIN group_roles gr  ON gr.role_id = gm.role_id
       JOIN cycles cy       ON cy.group_id = g.group_id AND cy.status = 'active'
       JOIN rounds r        ON r.cycle_id = cy.cycle_id AND r.status = 'open'
      WHERE gm.user_id = ? AND gm.status = 'active' AND g.deleted_at IS NULL`,
    [s.userId]
  );

  // 3. When it is MY turn to collect in each group
  const myTurns = await query(
    `SELECT g.group_id, g.group_name, rp.position_no, r.due_date AS payout_round_due_date,
            EXISTS(SELECT 1 FROM payouts p WHERE p.round_id = r.round_id) AS already_collected
       FROM group_members gm
       JOIN njangi_groups g       ON g.group_id = gm.group_id
       JOIN cycles cy             ON cy.group_id = gm.group_id AND cy.status = 'active'
       JOIN rotation_positions rp ON rp.cycle_id = cy.cycle_id AND rp.member_id = gm.member_id
       JOIN rounds r              ON r.cycle_id = cy.cycle_id AND r.round_number = rp.position_no
      WHERE gm.user_id = ?`,
    [s.userId]
  );

  // 4. Total I have contributed so far
  const totals = await query(
    `SELECT COALESCE(SUM(c.amount_paid), 0) AS total_contributed
       FROM contributions c
       JOIN group_members gm ON gm.member_id = c.member_id
      WHERE gm.user_id = ? AND c.status_id = 2`,
    [s.userId]
  );

  return ok({
    trustScore: trust?.trust_score ?? 50,
    dues,
    myTurns,
    totalContributed: totals[0].total_contributed,
  });
});
