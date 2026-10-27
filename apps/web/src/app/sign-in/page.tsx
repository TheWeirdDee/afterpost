"use client";

import Link from "next/link";
import { useState } from "react";
import { Arrow, Logo } from "@/components/ui";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr("Enter a valid work email, like name@company.com.");
      return;
    }
    setErr("");
    setSent(true);
  };

  return (
    <div className="auth">
      <aside className="auth-side">
        <div className="glow a" style={{ width: 560, height: 560, bottom: "-20%", left: "-20%" }} />
        <div style={{ position: "relative" }}><Logo /></div>
        <div style={{ position: "relative" }}>
          <h2 className="quote-q display" data-split>Evidence first. <em>Always</em> separate.</h2>
          <p className="lead" style={{ marginTop: 18 }} data-reveal>Delivery, observed activity and attribution stay in their own lanes, so every decision you make is one you can defend.</p>
        </div>
        <p className="asof" style={{ position: "relative" }}>Sign-in UI is ready; Auth.js wiring comes with the API.</p>
      </aside>
      <main className="auth-form">
        <div className="auth-card" data-reveal>
          <div className="show-m"><Logo /></div>
          {sent ? (
            <div style={{ display: "grid", gap: 16 }} role="status">
              <h1 className="display h-md">Check your inbox.</h1>
              <p className="lead" style={{ fontSize: 15 }}>If <b style={{ color: "var(--text)" }}>{email}</b> has access, a sign-in link is on its way. It expires in 15 minutes.</p>
              <Link href="/app" className="btn primary lg">Continue with sample data <Arrow /></Link>
              <button className="btn" onClick={() => setSent(false)}>Use a different email</button>
              <p className="asof">Email delivery isn&apos;t connected yet, so no message is actually sent.</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate style={{ display: "grid", gap: 18 }}>
              <div>
                <h1 className="display h-md">Welcome back.</h1>
                <p className="lead" style={{ fontSize: 15, marginTop: 8 }}>Sign in to your Afterpost workspace.</p>
              </div>
              <button type="button" className="btn lg" onClick={() => setSent(false)} title="Google sign-in arrives with Auth.js">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 0 1 0-12.4c1.9 0 3.2.8 3.9 1.5l2.7-2.6A10 10 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.8 0-.7-.1-1.2-.2-1.7z" /></svg>
                Continue with Google
              </button>
              <div className="divider">or with email</div>
              <div>
                <label className="lbl" htmlFor="email">Work email</label>
                <input id="email" className="field" type="email" autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err} aria-describedby={err ? "email-err" : undefined} />
                {err && <p id="email-err" role="alert" style={{ color: "var(--bad)", fontSize: 13, marginTop: 6 }}>{err}</p>}
              </div>
              <button className="btn primary lg" type="submit">Email me a sign-in link <Arrow /></button>
              <p className="asof">New here? Access is by invitation during early access.</p>
              <Link href="/" className="asof" style={{ textDecoration: "underline" }}>← Back to home</Link>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
