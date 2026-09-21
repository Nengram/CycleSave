import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="brand" style={{ color: "#fff", marginBottom: 12 }}>
            <Logo /> CycleSave
          </div>
          <p>Digital njangi: the trust of the tradition,<br />the transparency of a database.</p>
        </div>
        <div>
          <h4>Platform</h4>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/groups">My Groups</Link>
          <Link href="/explorer">Database</Link>
        </div>
        <div>
          <h4>Help</h4>
          <a href="/#how">How It Works</a>
          <a href="/#faq">FAQ</a>
          <Link href="/register">Create Account</Link>
        </div>
        <div>
          <h4>Payments</h4>
          <p>MTN MoMo</p>
          <p>Orange Money</p>
        </div>
      </div>
      <div className="footer-bottom">
        <div>© CycleSave 2026. All rights reserved.</div>
        <div>
          <span className="social">Douala, Cameroon</span>
          <span className="social">MySQL + Next.js</span>
        </div>
      </div>
    </footer>
  );
}
