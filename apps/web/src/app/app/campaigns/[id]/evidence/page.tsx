import { notFound } from "next/navigation";
import { getCampaign, fmtUtc } from "@/lib/data";
import { AsOf, BasisPill, Crumbs, Empty, EvidenceStatusPill } from "@/components/ui";

export const metadata = { title: "Evidence cabinet" };

export default async function Evidence({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCampaign(id);
  if (!c) notFound();
  return (
    <div className="page">
      <Crumbs
        items={[
          { label: "Campaigns", href: "/app/campaigns" },
          { label: c.title, href: `/app/campaigns/${c.id}` },
          { label: "Evidence" },
        ]}
      />
      <div className="page-head">
        <div>
          <h1 data-split>Evidence cabinet</h1>
          <p className="lead" style={{ marginTop: 10, fontSize: 16 }}>
            Every source, how it was verified, and which claims it supports.
          </p>
        </div>
        <button className="btn primary" disabled title="Adding evidence needs the API">
          Add evidence
        </button>
      </div>
      {c.evidence.length === 0 ? (
        <Empty
          title="No evidence yet"
          body="Add a post link, a screenshot or the signed agreement. Each item is stored with how it was verified, and never counted as proof until it is."
          cta={{ label: "Run an investigation", href: `/app/campaigns/${c.id}/investigate` }}
        />
      ) : (
        <>
          <div className="card tbl-desktop" style={{ padding: 0 }} data-reveal>
            <div className="scroll-x">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Evidence</th>
                    <th>Type</th>
                    <th>Trust level</th>
                    <th>Status</th>
                    <th>Supports</th>
                    <th>Observed</th>
                  </tr>
                </thead>
                <tbody>
                  {c.evidence.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <strong>{e.title}</strong>
                        <br />
                        <span className="sub mono">
                          {e.id} · {e.sourceRef}
                        </span>
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {e.kind}
                      </td>
                      <td>
                        <BasisPill s={e.verificationBasis} />
                      </td>
                      <td>
                        <EvidenceStatusPill s={e.status} />
                      </td>
                      <td className="sub">{e.supports.join(", ")}</td>
                      <td className="sub">{fmtUtc(e.observedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="cards-m" data-stagger="0.08">
            {c.evidence.map((e) => (
              <div key={e.id} className="card" style={{ display: "grid", gap: 8 }}>
                <strong>{e.title}</strong>
                <span className="sub mono" style={{ overflowWrap: "anywhere" }}>
                  {e.sourceRef}
                </span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <BasisPill s={e.verificationBasis} />
                  <EvidenceStatusPill s={e.status} />
                </div>
                <span className="sub">Supports: {e.supports.join(", ")}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <p style={{ marginTop: 18 }}>
        <AsOf />
      </p>
    </div>
  );
}
