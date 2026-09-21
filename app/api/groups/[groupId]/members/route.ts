import { handle, ok, need, readJson, ApiError } from "@/lib/http";
import { tx } from "@/lib/db";
import { groupContext, requireManage, GroupCtx } from "@/lib/access";
import { logAction } from "@/lib/audit";
import type { ResultSetHeader } from "mysql2/promise";

// The admin adds an existing user (found by phone number) to the group.
export const POST = handle(async (req: Request, ctx: GroupCtx) => {
  const { session, gid, m } = await groupContext(ctx);
  requireManage(m); // only the admin (creator) can add members

  const b = await readJson<{ phone: string; roleName?: "member" | "treasurer" }>(req);
  need(b.phone, "Phone number is required");

  const memberId = await tx(async (conn) => {
    // lock the group row so two admins can't overfill it at the same time
    const [[grp]] = await conn.query<any[]>(
      "SELECT max_members FROM njangi_groups WHERE group_id = ? FOR UPDATE",
      [gid]
    );
    const [[cnt]] = await conn.query<any[]>(
      "SELECT COUNT(*) AS n FROM group_members WHERE group_id = ? AND status = 'active'",
      [gid]
    );
    if (cnt.n >= grp.max_members) throw new ApiError(409, "The group is already full");

    const [[user]] = await conn.query<any[]>(
      "SELECT user_id FROM users WHERE phone = ? AND deleted_at IS NULL",
      [b.phone]
    );
    if (!user) throw new ApiError(404, "No registered user has this phone number");

    const [r] = await conn.query<ResultSetHeader>(
      `INSERT INTO group_members (group_id, user_id, role_id, joined_at)
       VALUES (?, ?, (SELECT role_id FROM group_roles WHERE role_name = ?), CURDATE())`,
      [gid, user.user_id, b.roleName ?? "member"]
    );
    await logAction(conn, {
      userId: session.userId, groupId: gid, action: "ADD_MEMBER",
      table: "group_members", recordId: r.insertId, req,
    });
    return r.insertId;
  });

  return ok({ memberId }, 201);
});
