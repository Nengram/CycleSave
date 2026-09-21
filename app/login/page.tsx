"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { FiArrowLeft, FiLogIn } from "react-icons/fi";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/create-njangi";

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Unable to log in");
      }

      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in");
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-back">
          <FiArrowLeft aria-hidden="true" />
          Back
        </Link>

        <div className="auth-heading">
          <div className="auth-icon">
            <FiLogIn aria-hidden="true" />
          </div>
          <h1>Welcome back</h1>
          <p>Log in to create and manage your Njangi.</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label>
            Phone number
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="6XXXXXXXX"
              required
              autoComplete="tel"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              autoComplete="current-password"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-lime btn-lg"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`}>
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
