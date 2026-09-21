import { query } from "./db";
import { ApiError } from "./http";
import { requireSession, Session } from "./auth";

export interface Membership {
  member_id: number;
  group_id: number;
  role_name: string;
  can_see_all: boolean; // admin / treasurer: sees everybody's data
  can_manage: boolean;  // admin only: manages the group
}

export type GroupCtx = { params: Promise<{ groupId: string }> };

/** Loads the caller's membership in a group. 403 if they are not an active member. */
export async function getMembership(userId: number, groupId: number): Promise<Membership> {
  const rows = await query(
    `SELECT gm.member_id, gm.group_id, gr.role_name, gr.can_see_all, gr.can_manage
       FROM group_members gm
       JOIN group_roles gr  ON gr.role_id = gm.role_id
       JOIN njangi_groups g ON g.group_id = gm.group_id
      WHERE gm.user_id = ? AND gm.group_id = ? AND gm.status = 'active' AND g.deleted_at IS NULL`,
    [userId, groupId]
  );
  if (!rows[0]) throw new ApiError(403, "You are not a member of this group");
  const r = rows[0];
  return {
    member_id: r.member_id,
    group_id: r.group_id,
    role_name: r.role_name,
    can_see_all: !!r.can_see_all,
    can_manage: !!r.can_manage,
  };
}

/** Every /groups/[groupId]/... route starts here: login check + valid id + membership check. */
export async function groupContext(
  ctx: GroupCtx
): Promise<{ session: Session; gid: number; m: Membership }> {
  const session = await requireSession();
  const { groupId } = await ctx.params;
  const gid = Number(groupId);
  if (!Number.isInteger(gid) || gid <= 0) throw new ApiError(400, "Invalid group id");
  const m = await getMembership(session.userId, gid);
  return { session, gid, m };
}

/** Only the group admin (the creator). */
export function requireManage(m: Membership) {
  if (!m.can_manage) throw new ApiError(403, "Only the group admin can do this");
}

/** Admin or treasurer: allowed to see everybody's data in the group. */
export function requireSeeAll(m: Membership) {
  if (!m.can_see_all) throw new ApiError(403, "Only the group admin or treasurer can see this");
}
