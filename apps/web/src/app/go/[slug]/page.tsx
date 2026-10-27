"use client";

import { use, useState } from "react";
import Link from "next/link";
import { trackingLinks } from "@/lib/data";
import { Arrow, Logo } from "@/components/ui";

export default function Go({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const link = trackingLinks.find((l) => l.slug === slug);
  const [wallet, setWallet] = useState<"idle" | "connecting" | "unavailable">("idle");

  return (
    <div className="go">
      <div className="glow a" style={{ width: 640, height: 640, top: "-20%", right: "-15%" }} />
      <div className="glow c" style={{ width: 480, height: 480, bottom: "-20%", left: "-10%" }} />
      <div className="go-card" data-reveal>
        <Logo />
        {link ? (
          <>
            <div>
              <span className="eyebrow">You followed a tracked link</span>
              <h1 className="display h-md" style={{ marginTop: 14 }}>
                Before you continue.
              </h1>
            </div>
            <div className="mini-card">
              <p style={{ fontSize: 14.5, color: "var(--muted)" }}>
                This link was shared as part of a paid promotion for{" "}
                <b style={{ color: "var(--text)" }}>{link.campaign}</b>. We record that this link
                was opened, so the team can understand which posts reached people.
              </p>
            </div>
            <div className="mini-card" style={{ display: "grid", gap: 8 }}>
              <strong style={{ fontSize: 15 }}>Privacy notice</strong>
              <ul className="checks" style={{ margin: 0, gap: 8 }}>
                <li>We store the link, the time, and a coarse region. No name, no email.</li>
                <li>
                  Connecting a wallet is optional. If you do, you sign a message that links this
                  click to that address.
                </li>
                <li>
                  Without a signed opt-in, your activity is never attributed to this campaign.
                </li>
              </ul>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <button
                className="btn lg"
                onClick={() => setWallet("unavailable")}
                disabled={wallet === "connecting"}
              >
                Connect wallet &amp; sign opt-in{" "}
                <span className="pill muted" style={{ height: 20, fontSize: 10.5 }}>
                  Optional
                </span>
              </button>
              {wallet === "unavailable" && (
                <p role="status" className="asof" style={{ color: "var(--warn)" }}>
                  Wallet signing isn&apos;t connected in this build, so nothing was recorded.
                </p>
              )}
              <Link href="/" className="btn primary lg">
                Continue without connecting <Arrow />
              </Link>
            </div>
            <p className="asof">Tracking link /go/{link.slug}</p>
          </>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <h1 className="display h-md">This link isn&apos;t active.</h1>
            <p className="lead" style={{ fontSize: 15 }}>
              The link may have expired or been mistyped. Nothing was recorded.
            </p>
            <Link href="/" className="btn primary">
              Go to Afterpost
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
