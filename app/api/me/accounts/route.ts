import { handle, ok, need, readJson } from "@/lib/http";
import { requireSession } from "@/lib/auth";
import { query, pool } from "@/lib/db";
import type { ResultSetHeader } from "mysql2/promise";

// My mobile money accounts (MTN MoMo / Orange Money).
export const GET = handle(async () => {
  const s = await requireSession();
  return ok(
    await query(
      `SELECT pa.account_id, mp.provider_name, pa.momo_number, pa.is_default
         FROM payment_accounts pa
         JOIN mobile_money_providers mp ON mp.provider_id = pa.provider_id
        WHERE pa.user_id = ?`,
      [s.userId]
    )
  );
});

// Add a new mobile money account to my profile.
export const POST = handle(async (req: Request) => {
  const s = await requireSession();
  const b = await readJson<{ providerId: number; momoNumber: string }>(req);
  need(
    b.providerId && /^\d{9,12}$/.test(b.momoNumber ?? ""),
    "Provider and a valid mobile money number are required"
  );
  const [r] = await pool.query<ResultSetHeader>(
    "INSERT INTO payment_accounts (user_id, provider_id, momo_number, is_default) VALUES (?,?,?,FALSE)",
    [s.userId, b.providerId, b.momoNumber]
  );
  return ok({ accountId: r.insertId }, 201);
});
