import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ApiError } from "./http";

const COOKIE = "njangi_session";

export interface Session {
  userId: number;
  name: string;
}

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_SECRET is missing or too short");
  return new TextEncoder().encode(s);
}

/** Creates a signed token and stores it in an httpOnly cookie (JavaScript in the browser cannot read it). */
export async function createSession(s: Session) {
  const token = await new SignJWT({ userId: s.userId, name: s.name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** Returns the logged-in user, or null if there is no valid cookie. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: Number(payload.userId), name: String(payload.name) };
  } catch {
    return null;
  }
}

/** Same as getSession, but throws 401 if nobody is logged in. Every protected route starts with this. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new ApiError(401, "Please log in");
  return s;
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}
