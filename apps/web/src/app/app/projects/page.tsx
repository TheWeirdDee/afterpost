import Link from "next/link";
import { projects } from "@/lib/data";
import { AsOf, Pill } from "@/components/ui";

export const metadata = { title: "Projects" };

export default function Projects() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="crumbs">Directory / Projects</p>
          <h1 data-split>Projects</h1>
        </div>
        <button className="btn primary" disabled title="Needs the API">Add project</button>
      </div>
      <div className="grid g2" data-stagger="0.1">
        {projects.map((p) => (
          <Link key={p.id} href={`/app/projects/${p.id}`} className="card" style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: 20 }}>{p.name}</strong>
              <Pill tone="good">{p.status.toLowerCase()}</Pill>
            </div>
            <p className="mono sub" style={{ overflowWrap: "anywhere" }}>${p.symbol} · {p.address}</p>
            <div className="mrow"><span>Chain</span><span>{p.chain}</span></div>
            <div className="mrow"><span>Campaigns</span><span className="mono">{p.campaigns}</span></div>
            <div className="mrow"><span>Spend (user reported)</span><span className="mono">${p.spend}</span></div>
          </Link>
        ))}
      </div>
      <p style={{ marginTop: 18 }}><AsOf /></p>
    </div>
  );
}
