import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function need(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new ApiError(400, msg);
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}

/** Wraps a route handler: turns ApiError and MySQL errors into clean JSON responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ApiError) return ok({ error: e.message }, e.status);
      const err = e as { errno?: number; sqlState?: string; sqlMessage?: string };
      if (err.sqlState === "45000") return ok({ error: err.sqlMessage ?? "Business rule violated" }, 409); // our triggers
      if (err.errno === 1062) return ok({ error: "This record already exists" }, 409); // UNIQUE
      if (err.errno === 1452) return ok({ error: "Referenced record does not exist" }, 400); // FOREIGN KEY
      console.error(e);
      return ok({ error: "Server error" }, 500);
    }
  };
}
