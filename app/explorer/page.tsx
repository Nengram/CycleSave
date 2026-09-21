"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiDatabase,
  FiShield,
  FiTable,
  FiKey,
  FiLayers,
  FiCheckCircle,
  FiArrowLeft,
  FiServer,
  FiTrendingUp,
} from "react-icons/fi";

type TableMeta = {
  category: "Entities" | "Lookups" | "Transactions" | "Audit";
  description: string;
  normalization: string;
  pk: string[];
  fks: Record<string, string>;
};

type ExplorerData = {
  tables: Array<{ table: string; rows: number }>;
  metadata: Record<string, TableMeta>;
};

export default function ExplorerPage() {
  const [data, setData] = useState<ExplorerData | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("njangi_groups");
  const [activeTab, setActiveTab] = useState<"schema" | "normalization" | "academic">("schema");

  useEffect(() => {
    fetch("/api/explorer", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((d) => {
        if (d && d.tables) {
          setData(d);
          if (d.tables.length > 0) {
            setSelectedTable(d.tables[0].table);
          }
        }
      })
      .catch((err) => console.error("Explorer fetch error:", err));
  }, []);

  const meta = data?.metadata[selectedTable];

  return (
    <div style={{ padding: "32px 0 80px" }}>
      {/* Page Header */}
      <div className="row between wrap gap-2" style={{ marginBottom: 28 }}>
        <div>
          <Link href="/dashboard" className="auth-back" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <FiArrowLeft />
            Back to Dashboard
          </Link>
          <h1 className="page-title">Database Display & Normalization Explorer</h1>
          <p className="section-sub">
            Academic presentation view: relational architecture, 1NF/2NF/3NF normalization, and ER constraints.
          </p>
        </div>

        <div className="row gap-2">
          <span className="badge badge-treasurer">
            <FiServer style={{ marginRight: 5, verticalAlign: -1 }} />
            MySQL 8.4 Relational Engine
          </span>
          <span className="badge badge-ok">
            <FiCheckCircle style={{ marginRight: 5, verticalAlign: -1 }} />
            BCNF Compliant
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "schema" ? "active" : ""}`}
          onClick={() => setActiveTab("schema")}
        >
          <FiTable style={{ marginRight: 6, verticalAlign: -1 }} />
          Relational Schema & Tables
        </button>
        <button
          className={`tab ${activeTab === "normalization" ? "active" : ""}`}
          onClick={() => setActiveTab("normalization")}
        >
          <FiLayers style={{ marginRight: 6, verticalAlign: -1 }} />
          Normalization Proof (1NF - BCNF)
        </button>
        <button
          className={`tab ${activeTab === "academic" ? "active" : ""}`}
          onClick={() => setActiveTab("academic")}
        >
          <FiShield style={{ marginRight: 6, verticalAlign: -1 }} />
          Njangi Sector Problem Analysis
        </button>
      </div>

      {activeTab === "schema" && (
        <div className="explorer">
          {/* Sidebar: Table list */}
          <div className="table-list">
            <div className="group-label">Core Database Tables</div>
            {data?.tables.map((t) => (
              <button
                key={t.table}
                className={`table-item ${selectedTable === t.table ? "active" : ""}`}
                onClick={() => setSelectedTable(t.table)}
              >
                <span>{t.table}</span>
                <span className="count">{t.rows} rows</span>
              </button>
            ))}
          </div>

          {/* Table Details */}
          <div className="panel">
            <div className="row between wrap gap-2" style={{ marginBottom: 16 }}>
              <div>
                <span className="badge badge-admin" style={{ marginBottom: 6 }}>
                  {meta?.category || "Table"}
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0" }}>
                  {selectedTable}
                </h2>
                <p className="muted small">{meta?.description}</p>
              </div>

              <div className="right">
                <span className="key key-pk">PK: {meta?.pk.join(", ") || "id"}</span>
                {meta?.fks && Object.keys(meta.fks).length > 0 && (
                  <span className="key key-fk">{Object.keys(meta.fks).length} Foreign Keys</span>
                )}
              </div>
            </div>

            <div className="divider" />

            {/* Normalization Note */}
            <div style={{ background: "var(--card)", padding: 18, borderRadius: 12, marginBottom: 24, border: "1px solid var(--line)" }}>
              <div className="row gap-2" style={{ marginBottom: 6 }}>
                <FiLayers style={{ color: "var(--ink)", fontSize: 18 }} />
                <strong style={{ fontSize: 14 }}>Normalization Level:</strong>
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                {meta?.normalization || "Fully normalized to eliminate update/delete anomalies."}
              </p>
            </div>

            {/* Foreign Key Constraints */}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              Relational Integrity & Foreign Keys
            </h3>
            {meta?.fks && Object.keys(meta.fks).length > 0 ? (
              <div className="table-wrap" style={{ marginBottom: 24 }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>Local Column</th>
                      <th>Constraint</th>
                      <th>Referenced Parent Entity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(meta.fks).map(([col, target]) => (
                      <tr key={col}>
                        <td><code>{col}</code></td>
                        <td><span className="key key-fk">FOREIGN KEY</span></td>
                        <td><code>{target}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="small muted" style={{ marginBottom: 24 }}>
                This is a root entity without outgoing foreign key dependencies.
              </p>
            )}

            {/* Sample Fields Preview */}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              Entity Architecture Specification
            </h3>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Key Type</th>
                    <th>Integrity Enforcement</th>
                  </tr>
                </thead>
                <tbody>
                  {meta?.pk.map((pk) => (
                    <tr key={pk}>
                      <td><strong>{pk}</strong></td>
                      <td><span className="key key-pk">PRIMARY KEY</span></td>
                      <td>Auto Increment, Unique identifier</td>
                    </tr>
                  ))}
                  {meta?.fks && Object.entries(meta.fks).map(([col, target]) => (
                    <tr key={col}>
                      <td>{col}</td>
                      <td><span className="key key-fk">FOREIGN KEY</span></td>
                      <td>Restricted ON DELETE CASCADE / RESTRICT to {target}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>created_at</td>
                    <td>TIMESTAMP</td>
                    <td>DEFAULT CURRENT_TIMESTAMP (Immutable audit timestamp)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "normalization" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 16 }}>
          <div className="panel">
            <h2 className="panel-title">1. First Normal Form (1NF) Compliance</h2>
            <p className="panel-sub">Elimination of repeating groups and multi-valued attributes.</p>
            <ul style={{ paddingLeft: 20, margin: "12px 0 0", color: "var(--ink-soft)", lineHeight: 1.8 }}>
              <li><strong>No multi-valued phone numbers in <code>users</code>:</strong> Traditional systems store multiple numbers in a single string. CycleSave separates payment accounts into <code>payment_accounts</code>.</li>
              <li><strong>Atomic attributes:</strong> Full names, phone numbers, transaction amounts, and rotation rounds are strictly atomic scalar values.</li>
              <li><strong>Distinct Primary Keys:</strong> Every table has a clearly defined surrogate key (e.g. <code>user_id</code>, <code>group_id</code>).</li>
            </ul>
          </div>

          <div className="panel">
            <h2 className="panel-title">2. Second Normal Form (2NF) Compliance</h2>
            <p className="panel-sub">Elimination of partial dependencies on composite keys.</p>
            <ul style={{ paddingLeft: 20, margin: "12px 0 0", color: "var(--ink-soft)", lineHeight: 1.8 }}>
              <li><strong>Junction Entity <code>group_members</code>:</strong> Associates <code>user_id</code> and <code>group_id</code>. Attributes like <code>role_id</code> and <code>joined_at</code> depend on the whole membership relation, not just the user or the group alone.</li>
              <li><strong>Rounds and Contributions:</strong> <code>contributions</code> relies on <code>(round_id, member_id)</code>, ensuring no partial dependencies on group metadata.</li>
            </ul>
          </div>

          <div className="panel">
            <h2 className="panel-title">3. Third Normal Form (3NF) & Boyce-Codd (BCNF) Compliance</h2>
            <p className="panel-sub">Elimination of transitive functional dependencies.</p>
            <ul style={{ paddingLeft: 20, margin: "12px 0 0", color: "var(--ink-soft)", lineHeight: 1.8 }}>
              <li><strong>Lookup Normalization:</strong> Non-key attributes never determine other non-key attributes. Providers (<code>mobile_money_providers</code>), frequencies (<code>contribution_frequencies</code>), and rotation methods (<code>rotation_methods</code>) are stored in dedicated lookup tables.</li>
              <li><strong>No Redundant Calculations:</strong> Total pot size is not stored redundantly in the database; it is dynamically calculated as <code>contribution_amount * member_count</code> to avoid update anomalies.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "academic" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 16 }}>
          <div className="panel">
            <h2 className="panel-title">Cameroon Njangi Sector Challenges & Database Solutions</h2>
            <p className="panel-sub">How our database schema directly solves the practical problems in Cameroonian ROSCAs.</p>

            <div className="feature-grid" style={{ marginTop: 20 }}>
              <div className="feature-card">
                <div className="icon-dot">
                  <FiShield />
                </div>
                <h3>1. Trust & Notebook Tampering</h3>
                <p>
                  Physical ledgers get lost, wet, or altered. CycleSave uses an immutable <code>audit_logs</code> table with automated triggers, making history tamper-proof.
                </p>
              </div>

              <div className="feature-card">
                <div className="icon-dot">
                  <FiTrendingUp />
                </div>
                <h3>2. Physical Cash Armed Robbery Risk</h3>
                <p>
                  Treasurers carrying 500,000+ FCFA across Douala or Yaoundé face physical insecurity. <code>payment_accounts</code> logs direct MTN MoMo and Orange Money transaction IDs.
                </p>
              </div>

              <div className="feature-card">
                <div className="icon-dot">
                  <FiLayers />
                </div>
                <h3>3. Rotation Dispute & Queue Jumping</h3>
                <p>
                  Admins in manual groups favor friends. <code>rotation_positions</code> locks the order upfront (Ballot, Seniority, or Bidding) so no member can quietly jump the queue.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
