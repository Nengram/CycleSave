// Whitelist of tables the explorer is allowed to show.
export const TABLES = [
  "mobile_money_providers", "contribution_frequencies", "rotation_methods",
  "group_roles", "payment_statuses", "penalty_types",
  "users", "payment_accounts", "njangi_groups", "group_members",
  "cycles", "rotation_positions", "rounds",
  "contributions", "payouts", "penalties",
  "trust_score_events", "notifications", "audit_logs",
] as const;

export type TableName = (typeof TABLES)[number];
