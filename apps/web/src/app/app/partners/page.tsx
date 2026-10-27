import Link from "next/link";
import { partners } from "@/lib/data";
import { AsOf, Pill } from "@/components/ui";

export const metadata = { title: "Partners" };

const tone = { CANDIDATE: "muted", TRIAL: "warn", ACTIVE: "good", PAUSED: "muted", DO_NOT_RENEW: "bad", ARCHIVED: "muted" } as const;

export default function Partners() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="crumbs">Directory / Partners</p>
          <h1 data-split>Partners</h1>
        </div>
        <button className="btn primary" disabled title="Needs the API">Add partner</button>
      </div>
      <div className="grid g3" data-stagger="0.1">
        {partners.map((p) => (
          <Link key={p.id} href={`/app/partners/${p.id}`} className="card" style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <span className="avatar">{p.displayName.slice(0, 2).toUpperCase()}</span>
              <Pill tone={tone[p.status]}>{p.status.replace("_", " ").toLowerCase()}</Pill>
            </div>
            <div>
              <strong style={{ fontSize: 18 }}>{p.displayName}</strong>
              <p className="sub mono">{p.handle}</p>
            </div>
            <p className="sub">{p.note}</p>
            <div className="mrow"><span>Campaigns</span><span className="mono">{p.campaigns}</span></div>
            <div className="mrow"><span>Delivery</span><span className="mono">{p.delivered}</span></div>
          </Link>
        ))}
      </div>
      <p style={{ marginTop: 18 }}><AsOf /></p>
    </div>
  );
}
