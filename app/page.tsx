import Link from "next/link";
import { getSession } from "@/lib/auth";
import {
  FiArrowRight,
  FiPlus,
  FiUserPlus,
  FiLogIn,
  FiCheckCircle,
  FiDatabase,
  FiShield,
  FiSmartphone,
} from "react-icons/fi";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div style={{ padding: "40px 0 80px" }}>
      {/* Hero Section */}
      <section
        style={{
          minHeight: "calc(100vh - 240px)",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
              background: "var(--lime-tint)",
              color: "var(--ink)",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            <FiShield aria-hidden="true" />
            Digital Njangi · Cameroon Rotating Savings
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(48px, 8vw, 92px)",
              lineHeight: 0.95,
              letterSpacing: "-0.055em",
              fontWeight: 800,
            }}
          >
            Create your
            <br />
            <span style={{ fontFamily: "var(--font-serif)", fontWeight: 400 }}>
              Njangi.
            </span>
          </h1>

          <p
            style={{
              maxWidth: 580,
              margin: "28px auto 36px",
              color: "var(--muted)",
              fontSize: "clamp(16px, 2vw, 19px)",
              lineHeight: 1.6,
            }}
          >
            {session
              ? `You are logged in as ${session.name}. Set up your contribution amount, rotation cycle, and manage everything with zero paperwork.`
              : "Start a transparent rotating savings group with CycleSave. Create an account, log in, and launch your savings association in minutes."}
          </p>

          {/* Primary CTA */}
          <div className="row center wrap gap-2" style={{ justifyContent: "center" }}>
            <Link
              href="/create-njangi"
              className="btn btn-lime btn-lg"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 12px 30px rgba(182, 230, 76, 0.35)",
              }}
            >
              <FiPlus aria-hidden="true" />
              Create New Njangi
              <FiArrowRight aria-hidden="true" />
            </Link>

            {session ? (
              <Link href="/groups" className="btn btn-dark btn-lg">
                My Groups
              </Link>
            ) : (
              <Link href="/register" className="btn btn-ghost btn-lg">
                <FiUserPlus aria-hidden="true" />
                Create Account First
              </Link>
            )}
          </div>

          {/* Flow Stepper for user clarity */}
          {!session && (
            <div
              style={{
                marginTop: 64,
                padding: "24px 28px",
                background: "var(--card)",
                borderRadius: 20,
                border: "1px solid var(--line)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 20,
                textAlign: "left",
              }}
            >
              <div className="row gap-2">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--ink)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Create Account</div>
                  <div className="small muted">Register with your name and phone.</div>
                </div>
              </div>

              <div className="row gap-2">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--ink)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Log In</div>
                  <div className="small muted">Access your personal dashboard.</div>
                </div>
              </div>

              <div className="row gap-2">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--lime)",
                    color: "var(--ink)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Create Njangi</div>
                  <div className="small muted">Set FCFA pot, frequency & rotation.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Database Explorer Preview Band */}
      <section
        style={{
          marginTop: 40,
          background: "var(--card)",
          borderRadius: 24,
          padding: "36px 40px",
          border: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <div className="row gap-2" style={{ marginBottom: 8 }}>
            <FiDatabase style={{ color: "var(--ink)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Academic Normalization Showcase
            </span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Relational Architecture & Database Explorer
          </h2>
          <p className="muted small" style={{ maxWidth: 540 }}>
            Inspect table entities, foreign key constraints, and mathematical 1NF/2NF/3NF/BCNF proofs.
          </p>
        </div>

        <Link href="/explorer" className="btn btn-dark">
          <FiDatabase aria-hidden="true" />
          Open Database Display
        </Link>
      </section>
    </div>
  );
}
