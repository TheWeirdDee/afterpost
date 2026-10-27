import Link from "next/link";
import { notFound } from "next/navigation";
import { campaigns, getProject, fmtMoney, statusTone } from "@/lib/data";
import { AsOf, Crumbs, Pill } from "@/components/ui";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) notFound();
  const mine = campaigns.filter((c) => c.projectId === p.id);
  return (
    <div className="page">
      <Crumbs items={[{ label: "Projects", href: "/app/projects" }, { label: p.name }]} />
      <div className="page-head">
        <div>
          <h1 data-split>{p.name}</h1>
          <div className="meta-row"><span className="mono">${p.symbol}</span><span>{p.chain}</span><span>Launchpad <b>{p.platform}</b></span></div>
        </div>
      </div>
      <div className="grid g-main">
        <section className="card" data-reveal>
          <h2>Campaigns</h2>
          <p className="sub" style={{ marginBottom: 10 }}>Promotional campaigns run for this token.</p>
          {mine.map((c) => (
            <div key={c.id} className="mrow" style={{ alignItems: "center" }}>
              <span><Link href={`/app/campaigns/${c.id}`} style={{ color: "var(--text)", fontWeight: 500 }}>{c.title}</Link><br /><span className="sub">{c.partnerName} · {fmtMoney(c.cost)}</span></span>
              <Pill tone={statusTone[c.status]}>{c.status.replace("_", " ").toLowerCase()}</Pill>
            </div>
          ))}
        </section>
        <section className="card" data-reveal data-delay="0.1">
          <h2>Token</h2>
          <p className="sub" style={{ marginBottom: 8 }}>Metadata verified onchain by the chain adapter.</p>
          <div className="mrow"><span>Symbol</span><span className="mono">{p.symbol}</span></div>
          <div className="mrow" style={{ flexDirection: "column", gap: 4 }}><span>Contract</span><span className="mono" style={{ overflowWrap: "anywhere", fontSize: 12.5 }}>{p.address}</span></div>
          <div className="mrow"><span>Chain</span><span>{p.chain}</span></div>
        </section>
      </div>
      <p style={{ marginTop: 18 }}><AsOf /></p>
    </div>
  );
}
