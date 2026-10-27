"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Arrow, Logo } from "@/components/ui";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr("Enter a valid work email, like name@company.com.");
      return;
    }
    if (!password) {
      setErr("Enter your password.");
      return;
    }
    setErr("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        router.push("/app");
        return;
      }
      const body = await response.json().catch(() => null);
      if (response.status === 401) {
        setErr("That email and password don't match an account.");
      } else {
        setErr(body?.message ?? "Sign-in failed. Please try again.");
      }
    } catch {
      setErr("Couldn't reach the server. Is the API running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-side">
        <div className="glow a" style={{ width: 560, height: 560, bottom: "-20%", left: "-20%" }} />
        <div style={{ position: "relative" }}>
          <Logo />
        </div>
        <div style={{ position: "relative" }}>
          <h2 className="quote-q display" data-split>
            Evidence first. <em>Always</em> separate.
          </h2>
          <p className="lead" style={{ marginTop: 18 }} data-reveal>
            Delivery, observed activity and attribution stay in their own lanes, so every decision
            you make is one you can defend.
          </p>
        </div>
        <p className="asof" style={{ position: "relative" }}>
          Email and password sign-in is live against the real API. Google (Auth.js) is still a
          placeholder.
        </p>
      </aside>
      <main className="auth-form">
        <div className="auth-card" data-reveal>
          <div className="show-m">
            <Logo />
          </div>
          <form onSubmit={submit} noValidate style={{ display: "grid", gap: 18 }}>
            <div>
              <h1 className="display h-md">Welcome back.</h1>
              <p className="lead" style={{ fontSize: 15, marginTop: 8 }}>
                Sign in to your Afterpost workspace.
              </p>
            </div>
            <button
              type="button"
              className="btn lg"
              disabled
              title="Google sign-in arrives with Auth.js"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 0 1 0-12.4c1.9 0 3.2.8 3.9 1.5l2.7-2.6A10 10 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.8 0-.7-.1-1.2-.2-1.7z"
                />
              </svg>
              Continue with Google
            </button>
            <div className="divider">or with email</div>
            <div>
              <label className="lbl" htmlFor="email">
                Work email
              </label>
              <input
                id="email"
                className="field"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!err}
                aria-describedby={err ? "form-err" : undefined}
              />
            </div>
            <div>
              <label className="lbl" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="field"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!err}
                aria-describedby={err ? "form-err" : undefined}
              />
              {err && (
                <p
                  id="form-err"
                  role="alert"
                  style={{ color: "var(--bad)", fontSize: 13, marginTop: 6 }}
                >
                  {err}
                </p>
              )}
            </div>
            <button className="btn primary lg" type="submit" disabled={submitting}>
              {submitting ? (
                "Signing in…"
              ) : (
                <>
                  Sign in <Arrow />
                </>
              )}
            </button>
            <p className="asof">New here? Access is by invitation during early access.</p>
            <Link href="/" className="asof" style={{ textDecoration: "underline" }}>
              ← Back to home
            </Link>
          </form>
        </div>
      </main>
    </div>
  );
}
