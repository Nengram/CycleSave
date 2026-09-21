"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiLogIn,
  FiUserPlus,
  FiPlus,
  FiLogOut,
  FiGrid,
  FiUsers,
  FiDatabase,
} from "react-icons/fi";
import Logo from "./Logo";

type NavbarProps = {
  user: { name: string } | null;
};

export default function Navbar({ user }: NavbarProps) {
  const path = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/");
    router.refresh();
  }

  const link = (href: string, label: string, icon: React.ReactNode) => {
    const active = href === "/" ? path === "/" : path.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        className={active ? "active" : ""}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontWeight: active ? 700 : 500,
          color: active ? "var(--ink)" : "var(--ink-soft)",
          padding: "6px 10px",
          borderRadius: 8,
          background: active ? "var(--lime-tint)" : "transparent",
        }}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <header className="nav">
      <div className="nav-left">
        <Link href="/" className="brand">
          <Logo />
          CycleSave
        </Link>

        <nav className="nav-links">
          {user ? (
            <>
              {link("/dashboard", "Dashboard", <FiGrid />)}
              {link("/groups", "My Groups", <FiUsers />)}
              {link("/explorer", "Database", <FiDatabase />)}
            </>
          ) : (
            <>
              {link("/", "Home", null)}
              {link("/explorer", "Database", <FiDatabase />)}
            </>
          )}
        </nav>
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <Link href="/create-njangi" className="btn btn-lime btn-sm">
              <FiPlus aria-hidden="true" />
              Create Njangi
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Log out">
              <FiLogOut aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost btn-sm">
              <FiLogIn aria-hidden="true" />
              Login
            </Link>
            <Link href="/register" className="btn btn-dark btn-sm">
              <FiUserPlus aria-hidden="true" />
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
