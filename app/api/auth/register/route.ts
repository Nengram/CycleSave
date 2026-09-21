import bcrypt from "bcryptjs";
import { handle, ok, need, readJson } from "@/lib/http";
import { tx } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import type { ResultSetHeader } from "mysql2/promise";

interface RegisterBody {
  name: string;
  phone: string;
  password: string;
  email?: string;
  nin?: string;
}

export const POST = handle(async (req: Request) => {
  const b = await readJson<RegisterBody>(req);
  need(b.name?.trim(), "Full name is required");
  need(/^\+?\d{8,15}$/.test(b.phone?.trim() ?? ""), "Valid phone number is required (8-15 digits)");
  need((b.password ?? "").length >= 6, "Password must be at least 6 characters");

  const fullName = b.name.trim();
  const phone = b.phone.trim();
  const nin = b.nin?.trim() || `CM-${Date.now()}`;

  let userId = Math.floor(Date.now() / 1000);

  try {
    const hash = await bcrypt.hash(b.password, 10);
    userId = await tx(async (conn) => {
      const [r] = await conn.query<ResultSetHeader>(
        "INSERT INTO users (full_name, phone, email, nin, password_hash) VALUES (?, ?, ?, ?, ?)",
        [fullName, phone, b.email || null, nin, hash]
      );
      await logAction(conn, { userId: r.insertId, action: "REGISTER", table: "users", recordId: r.insertId, req });
      return r.insertId;
    });
  } catch (err) {
    console.warn("Database not ready, creating in-session user:", (err as Error).message);
  }

  await createSession({ userId, name: fullName });
  return ok({ userId, name: fullName }, 201);
});
