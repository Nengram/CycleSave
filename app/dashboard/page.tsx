import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { fcfa } from "@/lib/api";
import {
  FiPlus,
  FiTrendingUp,
  FiShield,
  FiCalendar,
  FiArrowRight,
  FiClock,
  FiDollarSign,
  FiDatabase,
} from "react-icons/fi";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard");
  }

  return (
    <div style={{ padding: "32px 0 64px" }}>
      {/* Header */}
      <div className="row between wrap gap-2" style={{ marginBottom: 32 }}>
        <div>
          <span className="eyebrow">Personal Financial Overview</span>
          <h1 className="page-title">Welcome back, {session.name}</h1>
          <p className="section-sub">Track your contributions, upcoming rotation payouts, and trust rating.</p>
        </div>
        <div className="row gap-2">
          <Link href="/explorer" className="btn btn-ghost">
            <FiDatabase />
            Database Explorer
          </Link>
          <Link href="/create-njangi" className="btn btn-lime">
            <FiPlus />
            Create New Njangi
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card lime">
          <div className="stat-label">Total Saved / Contributed</div>
          <div className="stat-value">{fcfa(275000)}</div>
          <div className="stat-note">Across 2 active Njangi cycles</div>
        </div>

        <div className="stat-card dark">
          <div className="stat-label" style={{ color: "var(--lime)" }}>Next Payout Amount</div>
          <div className="stat-value">{fcfa(500000)}</div>
          <div className="stat-note" style={{ color: "#a5a5a5" }}>Round 3 · In 14 days</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Member Trust Score</div>
          <div className="stat-value" style={{ color: "var(--ok)" }}>98 <span style={{ fontSize: 18, color: "var(--muted)" }}>/ 100</span></div>
          <div className="meter">
            <span style={{ width: "98%" }} />
          </div>
          <div className="stat-note">100% on-time Mobile Money payments</div>
        </div>
      </div>

      {/* Main Grid: Active Groups + Recent Activity */}
      <div className="two-col" style={{ marginTop: 32 }}>
        {/* Active Groups */}
        <div className="panel">
          <div className="row between" style={{ marginBottom: 18 }}>
            <div>
              <h2 className="panel-title">Your Njangis</h2>
              <p className="panel-sub">Active rotating savings associations you belong to.</p>
            </div>
            <Link href="/groups" className="small" style={{ fontWeight: 600, color: "var(--ink)" }}>
              View All <FiArrowRight style={{ verticalAlign: -1 }} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: 16, background: "var(--card)", borderRadius: 14, border: "1px solid var(--line)" }}>
              <div className="row between">
                <span style={{ fontWeight: 700 }}>Douala Tech Entrepreneurs Njangi</span>
                <span className="badge badge-admin">Admin</span>
              </div>
              <div className="row between small muted mt-1">
                <span>Monthly · 50,000 FCFA</span>
                <span>Round 2 of 10</span>
              </div>
              <div className="progress" style={{ margin: "10px 0 6px" }}>
                <span style={{ width: "80%" }} />
              </div>
            </div>

            <div style={{ padding: 16, background: "var(--card)", borderRadius: 14, border: "1px solid var(--line)" }}>
              <div className="row between">
                <span style={{ fontWeight: 700 }}>Family Solidarity Pot</span>
                <span className="badge badge-member">Member</span>
              </div>
              <div className="row between small muted mt-1">
                <span>Bi-weekly · 25,000 FCFA</span>
                <span>Round 4 of 6</span>
              </div>
              <div className="progress" style={{ margin: "10px 0 6px" }}>
                <span style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Ledger & Transactions */}
        <div className="panel">
          <div className="row between" style={{ marginBottom: 18 }}>
            <div>
              <h2 className="panel-title">Recent Transactions</h2>
              <p className="panel-sub">Verified Mobile Money records with audit log.</p>
            </div>
            <span className="badge badge-ok">Verified</span>
          </div>

          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>MTN MoMo</strong>
                    <div className="small muted">Ref: CM-89410294</div>
                  </td>
                  <td>{fcfa(50000)}</td>
                  <td><span className="badge badge-ok">Confirmed</span></td>
                </tr>
                <tr>
                  <td>
                    <strong>Orange Money</strong>
                    <div className="small muted">Ref: CM-78119024</div>
                  </td>
                  <td>{fcfa(25000)}</td>
                  <td><span className="badge badge-ok">Confirmed</span></td>
                </tr>
                <tr>
                  <td>
                    <strong>MTN MoMo</strong>
                    <div className="small muted">Ref: CM-67210982</div>
                  </td>
                  <td>{fcfa(50000)}</td>
                  <td><span className="badge badge-ok">Confirmed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
