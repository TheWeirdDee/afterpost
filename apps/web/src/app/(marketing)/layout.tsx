import Link from "next/link";
import { Nav } from "@/components/marketing-client";
import { Logo } from "@/components/ui";

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Logo />
            <p className="lead" style={{ fontSize: 14.5, marginTop: 16, maxWidth: "36ch" }}>
              Know what your promoters delivered. Compare what you paid for with what went live, what the chain shows, and what stays unknown.
            </p>
            <p className="asof" style={{ marginTop: 16 }}>GenAI Works Open Agent Hackathon 2026 · Track 01</p>
          </div>
          <div>
            <h4>Product</h4>
            <Link href="/app">Workspace</Link>
            <Link href="/app/campaigns">Campaigns</Link>
            <Link href="/app/partners">Partners</Link>
            <Link href="/app/tracking">Tracking links</Link>
          </div>
          <div>
            <h4>Learn</h4>
            <Link href="/#lanes">Three lanes</Link>
            <Link href="/#pipeline">How it works</Link>
            <Link href="/#status">Build status</Link>
            <Link href="/#faq">FAQ</Link>
          </div>
          <div>
            <h4>Account</h4>
            <Link href="/sign-in">Sign in</Link>
            <Link href="/go/staking-s1">Sample tracking page</Link>
          </div>
        </div>
        <div className="giant" aria-hidden>Afterpost</div>
        <div className="foot-bottom">
          <span>© 2026 Afterpost. All rights reserved.</span>
          <span>Interface shows fixture data until the API is connected.</span>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
