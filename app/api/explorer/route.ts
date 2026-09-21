import { handle, ok, ApiError } from "@/lib/http";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { TABLES } from "@/lib/tables";

// Table descriptions and normalization level metadata for academic evaluation
export const TABLE_METADATA: Record<string, {
  category: "Entities" | "Lookups" | "Transactions" | "Audit";
  description: string;
  normalization: string;
  pk: string[];
  fks: Record<string, string>;
}> = {
  users: {
    category: "Entities",
    description: "Core member identity with hashed credentials, phone, and NIN",
    normalization: "3NF - Unique phone and national ID, no multi-valued attributes",
    pk: ["user_id"],
    fks: {},
  },
  payment_accounts: {
    category: "Entities",
    description: "Mobile Money accounts (MTN MoMo, Orange Money) linked to users",
    normalization: "3NF - Decoupled from users to support multiple provider numbers",
    pk: ["account_id"],
    fks: { user_id: "users.user_id", provider_id: "mobile_money_providers.provider_id" },
  },
  njangi_groups: {
    category: "Entities",
    description: "Rotating savings associations with rules, pot amount, and frequencies",
    normalization: "BCNF - All functional dependencies on primary key",
    pk: ["group_id"],
    fks: { frequency_id: "contribution_frequencies.frequency_id", method_id: "rotation_methods.method_id", created_by: "users.user_id" },
  },
  group_members: {
    category: "Entities",
    description: "Associative entity linking users to groups with assigned roles",
    normalization: "4NF - Independent multi-valued association solved via junction entity",
    pk: ["member_id"],
    fks: { group_id: "njangi_groups.group_id", user_id: "users.user_id", role_id: "group_roles.role_id" },
  },
  cycles: {
    category: "Transactions",
    description: "Full rotation cycles within a group",
    normalization: "3NF - Tracks cycle status, start, and planned end date",
    pk: ["cycle_id"],
    fks: { group_id: "njangi_groups.group_id" },
  },
  rotation_positions: {
    category: "Transactions",
    description: "Established queue order determining who receives which pot round",
    normalization: "3NF - Guarantees fair rotation without manual tampering",
    pk: ["position_id"],
    fks: { cycle_id: "cycles.cycle_id", member_id: "group_members.member_id" },
  },
  rounds: {
    category: "Transactions",
    description: "Individual contribution intervals within a cycle",
    normalization: "3NF - Connects specific beneficiary to the target collection pot",
    pk: ["round_id"],
    fks: { cycle_id: "cycles.cycle_id", beneficiary_member_id: "group_members.member_id" },
  },
  contributions: {
    category: "Transactions",
    description: "Payment records per member per round with MoMo transaction reference",
    normalization: "BCNF - Prevents double contributions per round per member",
    pk: ["contribution_id"],
    fks: { round_id: "rounds.round_id", member_id: "group_members.member_id", status_id: "payment_statuses.status_id" },
  },
  payouts: {
    category: "Transactions",
    description: "Lump sum distribution of the pot to the designated round recipient",
    normalization: "3NF - Disbursed only when all active members have contributed",
    pk: ["payout_id"],
    fks: { round_id: "rounds.round_id", recipient_member_id: "group_members.member_id" },
  },
  penalties: {
    category: "Transactions",
    description: "Automatic late fees and breach penalties",
    normalization: "3NF - Enforces discipline and reduces default risk in tontines",
    pk: ["penalty_id"],
    fks: { member_id: "group_members.member_id", round_id: "rounds.round_id", penalty_type_id: "penalty_types.type_id" },
  },
  audit_logs: {
    category: "Audit",
    description: "Append-only immutable system ledger for all database modifications",
    normalization: "Append-only - Tamper proof historical ledger",
    pk: ["log_id"],
    fks: { user_id: "users.user_id" },
  },
  mobile_money_providers: {
    category: "Lookups",
    description: "MTN Cameroon, Orange Cameroun",
    normalization: "Lookup Entity (Eliminates transitive redundancy)",
    pk: ["provider_id"],
    fks: {},
  },
  contribution_frequencies: {
    category: "Lookups",
    description: "Weekly, Bi-weekly, Monthly interval configuration",
    normalization: "Lookup Entity",
    pk: ["frequency_id"],
    fks: {},
  },
  rotation_methods: {
    category: "Lookups",
    description: "Ballot (lotto), Seniority, Bidding auction models",
    normalization: "Lookup Entity",
    pk: ["method_id"],
    fks: {},
  },
  group_roles: {
    category: "Lookups",
    description: "Admin (Creator), Treasurer, Member permissions",
    normalization: "Lookup Entity",
    pk: ["role_id"],
    fks: {},
  },
  payment_statuses: {
    category: "Lookups",
    description: "Pending, Confirmed, Failed, Disbursed",
    normalization: "Lookup Entity",
    pk: ["status_id"],
    fks: {},
  },
  penalty_types: {
    category: "Lookups",
    description: "Late contribution fee, absenteeism penalty",
    normalization: "Lookup Entity",
    pk: ["type_id"],
    fks: {},
  },
};

export const GET = handle(async () => {
  let tableCounts: Array<{ table: string; rows: number }> = [];

  try {
    tableCounts = await Promise.all(
      TABLES.map(async (t) => {
        try {
          const res = await query(`SELECT COUNT(*) AS n FROM \`${t}\``);
          return { table: t, rows: res[0]?.n ?? 0 };
        } catch {
          return { table: t, rows: 0 };
        }
      })
    );
  } catch {
    // Fallback seed counts for demo display
    const mockCounts: Record<string, number> = {
      users: 12,
      payment_accounts: 14,
      njangi_groups: 3,
      group_members: 24,
      cycles: 3,
      rotation_positions: 24,
      rounds: 18,
      contributions: 142,
      payouts: 12,
      penalties: 5,
      audit_logs: 186,
      mobile_money_providers: 2,
      contribution_frequencies: 3,
      rotation_methods: 3,
      group_roles: 3,
      payment_statuses: 4,
      penalty_types: 2,
    };
    tableCounts = TABLES.map((t) => ({ table: t, rows: mockCounts[t] ?? 0 }));
  }

  return ok({
    tables: tableCounts,
    metadata: TABLE_METADATA,
  });
});
