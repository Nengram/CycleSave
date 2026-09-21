"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { FiArrowLeft, FiUserPlus } from "react-icons/fi";
import { useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/create-njangi";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          phone,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Unable to create account");
      }

      window.location.href = next;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create account"
      );
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
            <FiUserPlus aria-hidden="true" />
          </div>
          <h1>Create your account</h1>
          <p>You need an account before creating a Njangi.</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label>
            Full name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              autoComplete="name"
            />
          </label>

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
              placeholder="Create a password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-lime btn-lg"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`}>
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
