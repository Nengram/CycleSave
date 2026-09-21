"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiPlus } from "react-icons/fi";

type Lookup = {
  providers: Array<{
    provider_id: number;
    provider_name: string;
  }>;
  frequencies: Array<{
    frequency_id: number;
    frequency_name: string;
    interval_days: number;
  }>;
  methods: Array<{
    method_id: number;
    method_name: string;
    description: string;
  }>;
};

export default function CreateNjangiForm({
  userName,
}: {
  userName: string;
}) {
  const [lookups, setLookups] = useState<Lookup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [amount, setAmount] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [frequencyId, setFrequencyId] = useState("");
  const [methodId, setMethodId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/lookups", { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Unable to load options");
        }

        setLookups(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load options");
      });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          groupName,
          contributionAmount: Number(amount),
          maxMembers: Number(maxMembers),
          frequencyId: Number(frequencyId),
          methodId: Number(methodId),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Unable to create Njangi");
      }

      window.location.href = `/groups/${data.groupId}`;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create Njangi"
      );
      setLoading(false);
    }
  }

  return (
    <main className="create-page">
      <div className="create-header">
        <Link href="/" className="auth-back">
          <FiArrowLeft aria-hidden="true" />
          Back
        </Link>

        <div>
          <p className="eyebrow">Welcome, {userName}</p>
          <h1>Create New Njangi</h1>
          <p>Set up the basic rules for your savings group.</p>
        </div>
      </div>

      <form onSubmit={submit} className="create-card">
        <label>
          Njangi name
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Friends & Family"
            required
          />
        </label>

        <div className="form-grid">
          <label>
            Contribution amount
            <div className="input-with-suffix">
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="20000"
                required
              />
              <span>FCFA</span>
            </div>
          </label>

          <label>
            Maximum members
            <input
              type="number"
              min="2"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              placeholder="10"
              required
            />
          </label>
        </div>

        <div className="form-grid">
          <label>
            Contribution frequency
            <select
              value={frequencyId}
              onChange={(e) => setFrequencyId(e.target.value)}
              required
              disabled={!lookups}
            >
              <option value="">Select frequency</option>
              {lookups?.frequencies.map((frequency) => (
                <option
                  key={frequency.frequency_id}
                  value={frequency.frequency_id}
                >
                  {frequency.frequency_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Rotation method
            <select
              value={methodId}
              onChange={(e) => setMethodId(e.target.value)}
              required
              disabled={!lookups}
            >
              <option value="">Select method</option>
              {lookups?.methods.map((method) => (
                <option key={method.method_id} value={method.method_id}>
                  {method.method_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <div className="form-error">{error}</div>}

        <button
          type="submit"
          className="btn btn-lime btn-lg"
          disabled={loading || !lookups}
        >
          <FiPlus aria-hidden="true" />
          {loading ? "Creating..." : "Create Njangi"}
        </button>
      </form>
    </main>
  );
}
