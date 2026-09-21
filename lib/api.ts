// Small helpers used by the pages (browser side).

/** Calls our API. Throws an Error with the server's message when the response is not OK. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api<T = any>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error ?? "Request failed") as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

/** 20000 -> "20,000 FCFA" */
export const fcfa = (n: number | string | null | undefined) =>
  `${Number(n ?? 0).toLocaleString("en-US")} FCFA`;

/** "2026-09-05" -> "05 Sep 2026" */
export function fdate(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s.replace(" ", "T"));
  return isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** "2026-09-05 10:30:00" -> "05 Sep 2026, 10:30" */
export function fdatetime(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s.replace(" ", "T"));
  return isNaN(d.getTime())
    ? s
    : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
