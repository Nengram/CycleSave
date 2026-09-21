import { handle, ok } from "@/lib/http";
import { query } from "@/lib/db";

const DEFAULT_LOOKUPS = {
  providers: [
    { provider_id: 1, provider_name: "MTN Mobile Money (MoMo)" },
    { provider_id: 2, provider_name: "Orange Money" },
  ],
  frequencies: [
    { frequency_id: 1, frequency_name: "Weekly", interval_days: 7 },
    { frequency_id: 2, frequency_name: "Bi-weekly (Every 2 weeks)", interval_days: 14 },
    { frequency_id: 3, frequency_name: "Monthly", interval_days: 30 },
  ],
  methods: [
    { method_id: 1, method_name: "Random Ballot (Tirage au sort)", description: "Fair random lottery at cycle start" },
    { method_id: 2, method_name: "Seniority / Need-Based", description: "Priority by elder status or mutual agreement" },
    { method_id: 3, method_name: "Bidding Auction", description: "Highest discount bid takes the pot first" },
  ],
  roles: [
    { role_id: 1, role_name: "Admin" },
    { role_id: 2, role_name: "Treasurer" },
    { role_id: 3, role_name: "Member" },
  ],
};

// Reference data for dropdowns in forms
export const GET = handle(async () => {
  try {
    const [providers, frequencies, methods, roles] = await Promise.all([
      query("SELECT provider_id, provider_name FROM mobile_money_providers"),
      query("SELECT frequency_id, frequency_name, interval_days FROM contribution_frequencies"),
      query("SELECT method_id, method_name, description FROM rotation_methods"),
      query("SELECT role_id, role_name FROM group_roles"),
    ]);

    if (providers.length && frequencies.length && methods.length) {
      return ok({ providers, frequencies, methods, roles });
    }
  } catch (err) {
    console.warn("Using default lookups (DB unreachable):", (err as Error).message);
  }

  // Graceful fallback to guarantee UI always loads
  return ok(DEFAULT_LOOKUPS);
});
