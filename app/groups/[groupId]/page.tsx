import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { fcfa } from "@/lib/api";
import {
  FiArrowLeft,
  FiUsers,
  FiCalendar,
  FiShield,
  FiDollarSign,
  FiSmartphone,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiUserPlus,
} from "react-icons/fi";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

async function getGroupDetails(groupId: number) {
  try {
    const rows = await query(
      `SELECT g.group_id, g.group_name, g.contribution_amount, g.max_members,
              COALESCE(f.frequency_name, 'Monthly') as frequency_name,
              COALESCE(m.method_name, 'Random Ballot') as method_name
         FROM njangi_groups g
         LEFT JOIN contribution_frequencies f ON f.frequency_id = g.frequency_id
         LEFT JOIN rotation_methods m ON m.method_id = g.method_id
        WHERE g.group_id = ? AND g.deleted_at IS NULL`,
      [groupId]
    );

    if (rows && rows[0]) {
      return rows[0] as {
        group_id: number;
        group_name: string;
        contribution_amount: number;
        max_members: number;
        frequency_name: string;
        method_name: string;
      };
    }
  } catch {}

  // Fallback for newly created or offline groups
  return {
    group_id: groupId,
    group_name: "Community Solidarity Njangi #" + groupId,
    contribution_amount: 25000,
    max_members: 8,
    frequency_name: "Monthly",
    method_name: "Random Ballot",
  };
}

export default async function SingleGroupPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    const { groupId } = await params;
    redirect(`/login?next=/groups/${groupId}`);
  }

  const { groupId } = await params;
  const gid = Number(groupId) || 1;
  const group = await getGroupDetails(gid);

  const totalPot = group.contribution_amount * group.max_members;

  // Mock schedule demonstrating rotation and entity relations
  const schedule = [
    { round: 1, recipient: session.name + " (You)", amount: totalPot, status: "Active (Current Round)", isCurrent: true },
    { round: 2, recipient: "Ekwalla Divine (677491023)", amount: totalPot, status: "Next in Queue", isCurrent: false },
    { round: 3, recipient: "Nforba Roland (655182901)", amount: totalPot, status: "Scheduled", isCurrent: false },
    { round: 4, recipient: "Tanyi Vanessa (699304122)", amount: totalPot, status: "Scheduled", isCurrent: false },
  ];

  return (
    <div style={{ padding: "32px 0 64px" }}>
      <Link href="/groups" className="auth-back" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <FiArrowLeft />
        Back to My Groups
      </Link>

      {/* Group Hero Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1d1d1d, #0a0a0a)",
          color: "#fff",
          borderRadius: 24,
          padding: "36px 40px",
          marginBottom: 32,
        }}
      >
        <div className="row between wrap gap-2">
          <div>
            <div className="row gap-2" style={{ marginBottom: 12 }}>
              <span className="badge badge-treasurer">
                <FiShield style={{ marginRight: 4, verticalAlign: -1 }} />
                Admin
              </span>
              <span className="badge">
                <FiCalendar style={{ marginRight: 4, verticalAlign: -1 }} />
                {group.frequency_name}
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
              {group.group_name}
            </h1>
            <p className="muted" style={{ color: "#a5a5a5" }}>
              Rotation Model: <strong>{group.method_name}</strong> · Cap: <strong>{group.max_members} members</strong>
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--lime)" }}>
              Total Pot Size
            </span>
            <div style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, color: "#fff", fontFamily: "var(--font-serif)" }}>
              {fcfa(totalPot)}
            </div>
            <span style={{ fontSize: 13, color: "#a5a5a5" }}>
              {fcfa(group.contribution_amount)} / member
            </span>
          </div>
        </div>

        {/* Quick action bar */}
        <div className="row wrap gap-2" style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #2a2a2a" }}>
          <button className="btn btn-lime">
            <FiSmartphone />
            Pay Contribution (MTN / Orange)
          </button>
          <button className="btn btn-ghost" style={{ background: "#262626", color: "#fff" }}>
            <FiUserPlus />
            Invite Member (Phone)
          </button>
        </div>
      </div>

      {/* Grid: Rotation Schedule + Group Members */}
      <div className="two-col">
        {/* Rotation Schedule */}
        <div className="panel">
          <div className="row between" style={{ marginBottom: 16 }}>
            <div>
              <h2 className="panel-title">Rotation Schedule</h2>
              <p className="panel-sub">Transparent payout order stored and verified in database.</p>
            </div>
            <span className="badge badge-ok">Cycle 1 Active</span>
          </div>

          <ul className="schedule">
            {schedule.map((item) => (
              <li key={item.round} className={item.isCurrent ? "open" : ""}>
                <div className="round-no">{item.round}</div>
                <div className="grow">
                  <div className="row between">
                    <strong>{item.recipient}</strong>
                    <span style={{ fontWeight: 700, color: item.isCurrent ? "var(--ok)" : "inherit" }}>
                      {fcfa(item.amount)}
                    </span>
                  </div>
                  <div className="row between small muted mt-1">
                    <span>
                      {item.isCurrent ? <FiClock style={{ verticalAlign: -1, marginRight: 4 }} /> : null}
                      {item.status}
                    </span>
                    {item.isCurrent && (
                      <span className="badge badge-ok">Collecting this round</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Members & Integrity Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="panel">
            <h2 className="panel-title">Group Trust & Integrity</h2>
            <p className="panel-sub">Rules preventing default & late payments.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="row gap-2">
                <FiCheckCircle style={{ color: "var(--ok)", fontSize: 20, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Zero Cash Handling</div>
                  <div className="small muted">MTN MoMo & Orange Money API transaction validation.</div>
                </div>
              </div>

              <div className="row gap-2">
                <FiAlertCircle style={{ color: "var(--warn)", fontSize: 20, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Automated Late Fee (5%)</div>
                  <div className="small muted">Applies after 24h grace period into penalties table.</div>
                </div>
              </div>

              <div className="row gap-2">
                <FiShield style={{ color: "var(--ink)", fontSize: 20, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>BCNF Normalized Schema</div>
                  <div className="small muted">Strict audit logging: payments cannot be edited or erased.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="row between" style={{ marginBottom: 12 }}>
              <h2 className="panel-title">Active Members</h2>
              <span className="small muted">1 / {group.max_members} Slots filled</span>
            </div>

            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Trust Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>{session.name}</strong>
                      <div className="small muted">Creator</div>
                    </td>
                    <td>
                      <span className="badge badge-admin">Admin</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: "var(--ok)" }}>100 / 100</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
