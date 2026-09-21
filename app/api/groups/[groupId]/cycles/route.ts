import { handle, ok, need, readJson, ApiError } from "@/lib/http";
import { query, tx } from "@/lib/db";
import { groupContext, requireManage, GroupCtx } from "@/lib/access";
import { logAction } from "@/lib/audit";
import { addDays } from "@/lib/util";
import type { ResultSetHeader } from "mysql2/promise";

// List the cycles of a group (any member can see them).
export const GET = handle(async (_req: Request, ctx: GroupCtx) => {
  const { gid } = await groupContext(ctx);
  return ok(
    await query(
      `SELECT cycle_id, cycle_number, start_date, end_date, status
         FROM cycles WHERE group_id = ? ORDER BY cycle_number DESC`,
      [gid]
    )
  );
});

// The admin starts a cycle. `order` = member ids in the order they will collect.
// Creates: 1 cycle + one rotation position per member + one round per member.
export const POST = handle(async (req: Request, ctx: GroupCtx) => {
  const { session, gid, m } = await groupContext(ctx);
  requireManage(m);

  const b = await readJson<{ startDate: string; order: number[] }>(req);
  need(/^\d{4}-\d{2}-\d{2}$/.test(b.startDate ?? ""), "startDate must be YYYY-MM-DD");
  need(Array.isArray(b.order) && b.order.length >= 2, "Give the collection order (list of member ids)");

  const cycleId = await tx(async (conn) => {
    const [[grp]] = await conn.query<any[]>(
      `SELECT cf.interval_days
         FROM njangi_groups g
         JOIN contribution_frequencies cf ON cf.frequency_id = g.frequency_id
        WHERE g.group_id = ? FOR UPDATE`,
      [gid]
    );

    const [[active]] = await conn.query<any[]>(
      "SELECT COUNT(*) AS n FROM cycles WHERE group_id = ? AND status = 'active'",
      [gid]
    );
    if (active.n > 0) throw new ApiError(409, "This group already has an active cycle");

    // the order must contain every active member exactly once
    const [members] = await conn.query<any[]>(
      "SELECT member_id FROM group_members WHERE group_id = ? AND status = 'active'",
      [gid]
    );
    const ids = new Set(members.map((x) => x.member_id));
    if (
      b.order.length !== ids.size ||
      new Set(b.order).size !== ids.size ||
      !b.order.every((id) => ids.has(id))
    )
      throw new ApiError(400, "The order must list every active member exactly once");

    const [[next]] = await conn.query<any[]>(
      "SELECT COALESCE(MAX(cycle_number), 0) + 1 AS n FROM cycles WHERE group_id = ?",
      [gid]
    );
    const lastDue = addDays(b.startDate, b.order.length * grp.interval_days);

    const [c] = await conn.query<ResultSetHeader>(
      "INSERT INTO cycles (group_id, cycle_number, start_date, end_date, status) VALUES (?,?,?,?, 'active')",
      [gid, next.n, b.startDate, lastDue]
    );

    for (let i = 0; i < b.order.length; i++) {
      await conn.query(
        "INSERT INTO rotation_positions (cycle_id, member_id, position_no) VALUES (?,?,?)",
        [c.insertId, b.order[i], i + 1]
      );
      await conn.query(
        "INSERT INTO rounds (cycle_id, round_number, due_date, status) VALUES (?,?,?,?)",
        [c.insertId, i + 1, addDays(b.startDate, (i + 1) * grp.interval_days), i === 0 ? "open" : "pending"]
      );
    }

    await conn.query("UPDATE njangi_groups SET status = 'active' WHERE group_id = ?", [gid]);
    await logAction(conn, {
      userId: session.userId, groupId: gid, action: "CREATE_CYCLE",
      table: "cycles", recordId: c.insertId, req,
    });
    return c.insertId;
  });

  return ok({ cycleId }, 201);
});
