"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { Logo } from "./ui";

const I = (d: string) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const nav = [
  { g: "Workspace", items: [
    { href: "/app", label: "Overview", icon: I("M3 9.5 10 3l7 6.5V17H3z") },
    { href: "/app/campaigns", label: "Campaigns", icon: I("M4 5h12M4 10h12M4 15h8") },
  ] },
  { g: "Directory", items: [
    { href: "/app/partners", label: "Partners", icon: I("M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 17c0-3 2.5-5 5-5s5 2 5 5M14 8a2.5 2.5 0 1 0 0-5M15 12c2 .3 3 2 3 4") },
    { href: "/app/projects", label: "Projects", icon: I("M3 6l7-3 7 3-7 3zM3 10l7 3 7-3M3 14l7 3 7-3") },
    { href: "/app/tracking", label: "Tracking links", icon: I("M8 12l4-4M7 9 5 11a3 3 0 0 0 4 4l2-2M13 11l2-2a3 3 0 0 0-4-4L9 7") },
  ] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const main = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const l = (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;
    if (open) l?.stop();
    else l?.start();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // soft page transition on route change
  useEffect(() => {
    registerGsap();
    if (!main.current || document.documentElement.classList.contains("reduced")) return;
    gsap.fromTo(main.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", clearProps: "transform" });
  }, [path]);

  const isOn = (h: string) => (h === "/app" ? path === "/app" : path.startsWith(h));

  return (
    <div className="shell">
      <div className={`scrim${open ? " open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`side${open ? " open" : ""}`} aria-label="Sidebar">
        <div style={{ padding: "6px 8px" }}><Logo href="/" /></div>
        <nav aria-label="App">
          {nav.map((g) => (
            <div key={g.g} style={{ display: "grid", gap: 2, marginBottom: 14 }}>
              <span className="grp">{g.g}</span>
              {g.items.map((it) => (
                <Link key={it.href} href={it.href} className={`item${isOn(it.href) ? " on" : ""}`} aria-current={isOn(it.href) ? "page" : undefined}>
                  {it.icon}
                  {it.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="me">
          <span className="avatar">DN</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 500 }}>Divine Nation</div>
            <Link href="/sign-in" style={{ color: "var(--dim)", fontSize: 12 }}>Switch account</Link>
          </div>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <Logo href="/" />
          <button className="burger" style={{ display: "block" }} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <i />
            <i />
          </button>
        </div>
        <div ref={main}>{children}</div>
      </div>
    </div>
  );
}
