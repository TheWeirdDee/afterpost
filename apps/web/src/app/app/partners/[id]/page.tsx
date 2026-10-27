import Link from "next/link";
import { notFound } from "next/navigation";
import { campaigns, getPartner, fmtDate, actionLabel } from "@/lib/data";
import { AsOf, Crumbs, Empty, Pill } from "@/components/ui";

export default async function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getPartner(id);
  if (!p) notFound();
  const mine = campaigns.filter((c) => c.partnerId === p.id);
  return (
    <div className="page">
      <Crumbs items={[{ label: "Partners", href: "/app/partners" }, { label: p.displayName }]} />
      <div className="page-head">
        <div>
          <h1 data-split>{p.displayName}</h1>
          <div className="meta-row">
            <span className="mono">{p.handle}</span>
            <Pill tone="muted">{p.status.replace("_", " ").toLowerCase()}</Pill>
            {p.profileUrl && <a href={p.profileUrl} target="_blank" rel="noreferrer noopener" style={{ textDecoration: "underline" }}>Public profile ↗</a>}
          </div>
        </div>
      </div>
      <div className="grid g-main">
        <section className="card" data-reveal>
          <h2>Engagements</h2>
          <p className="sub" style={{ marginBottom: 12 }}>Every campaign with this partner, with its own evidence-based outcome.</p>
          {mine.length === 0 ? (
            <Empty title="No engagements yet" body="Campaigns you run with this partner will be listed here." />
          ) : (
            mine.map((c) => (
              <div key={c.id} className="mrow" style={{ alignItems: "center" }}>
                <span><Link href={`/app/campaigns/${c.id}`} style={{ color: "var(--text)", fontWeight: 500 }}>{c.title}</Link><br /><span className="sub">{fmtDate(c.startAt)} – {fmtDate(c.endAt)}</span></span>
                {c.suggestedAction ? <Pill tone={actionLabel[c.suggestedAction].tone}>{actionLabel[c.suggestedAction].label}</Pill> : <span className="sub">Not evaluated</span>}
              </div>
            ))
          )}
        </section>
        <section className="card" data-reveal data-delay="0.1">
          <h2>Summary</h2>
          <p className="sub" style={{ marginBottom: 8 }}>{p.note}</p>
          <div className="mrow"><span>Campaigns</span><span className="mono">{p.campaigns}</span></div>
          <div className="mrow"><span>Delivery</span><span className="mono">{p.delivered}</span></div>
          <p className="sub" style={{ marginTop: 14 }}>Delivery is never combined with market results to rank partners.</p>
        </section>
      </div>
      <p style={{ marginTop: 18 }}><AsOf /></p>
    </div>
  );
}
