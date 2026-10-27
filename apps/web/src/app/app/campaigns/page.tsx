"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CampaignStatus } from "@afterpost/contracts";
import { campaigns, fmtDate, fmtMoney, fmtUtc, actionLabel, statusTone } from "@/lib/data";
import { AsOf, Empty, Pill } from "@/components/ui";

const filters: ("ALL" | CampaignStatus)[] = ["ALL", "IN_REVIEW", "ACTIVE", "COMPLETED", "DRAFT"];
const label = (s: string) => s.replace("_", " ").toLowerCase().replace(/^./, (x) => x.toUpperCase());

function Cover({ c }: { c: (typeof campaigns)[number] }) {
  const ks = ["delivery", "market", "attribution"] as const;
  return (
    <span className="cover" role="img" aria-label={ks.map((k) => `${k}: ${c.lanes[k].coverage.toLowerCase()}`).join(", ")} title="Delivery · Observed · Attribution">
      {ks.map((k) => {
        const cov = c.lanes[k].coverage;
        return <i key={k} className={cov === "COMPLETE" || cov === "PARTIAL" ? "on" : ""} style={{ ["--c" as string]: cov === "PARTIAL" ? "var(--warn)" : `var(--${k})` }} />;
      })}
    </span>
  );
}

export default function Campaigns() {
  const [f, setF] = useState<(typeof filters)[number]>("ALL");
  const [q, setQ] = useState("");
  const rows = useMemo(
    () => campaigns.filter((c) => (f === "ALL" || c.status === f) && (c.title + c.partnerName + c.projectName).toLowerCase().includes(q.toLowerCase())),
    [f, q],
  );
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="crumbs">Workspace / Campaigns</p>
          <h1 data-split>Campaigns</h1>
        </div>
        <button className="btn primary" disabled title="Creating campaigns needs the API">New campaign</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }} data-reveal>
        <div className="seg" role="group" aria-label="Filter by status" style={{ overflowX: "auto", maxWidth: "100%" }}>
          {filters.map((x) => (
            <button key={x} aria-pressed={f === x} onClick={() => setF(x)}>
              {x === "ALL" ? "All" : label(x)}
            </button>
          ))}
        </div>
        <input className="field" style={{ maxWidth: 280, height: 38 }} placeholder="Search campaigns, partners…" aria-label="Search campaigns" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {rows.length === 0 ? (
        <Empty title="No campaigns match" body="Try clearing the filter or search. If this workspace is new, add its first campaign to begin." />
      ) : (
        <>
          <div className="card tbl-desktop" style={{ padding: 0 }} data-reveal>
            <div className="scroll-x">
              <table className="tbl">
                <thead>
                  <tr><th>Campaign</th><th>Status</th><th>Dates</th><th>Paid</th><th>Coverage</th><th>Suggested</th><th>Last evaluated</th></tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="row">
                      <td>
                        <Link className="link" href={`/app/campaigns/${c.id}`}>{c.title}</Link>
                        <br />
                        <span className="sub">{c.partnerName} · {c.projectName}</span>
                      </td>
                      <td><Pill tone={statusTone[c.status]}>{label(c.status)}</Pill></td>
                      <td className="sub" style={{ whiteSpace: "nowrap" }}>{fmtDate(c.startAt)}<br />{fmtDate(c.endAt)}</td>
                      <td className="mono">{fmtMoney(c.cost)}</td>
                      <td><Cover c={c} /></td>
                      <td>{c.suggestedAction ? <Pill tone={actionLabel[c.suggestedAction].tone}>{actionLabel[c.suggestedAction].label}</Pill> : <span className="sub">—</span>}</td>
                      <td className="sub">{fmtUtc(c.lastEvaluatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="cards-m" data-stagger="0.08">
            {rows.map((c) => (
              <Link key={c.id} href={`/app/campaigns/${c.id}`} className="card" style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong>{c.title}</strong>
                  <Pill tone={statusTone[c.status]}>{label(c.status)}</Pill>
                </div>
                <span className="sub">{c.partnerName} · {c.projectName}</span>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mono">{fmtMoney(c.cost)}</span>
                  <Cover c={c} />
                </div>
                {c.suggestedAction && <Pill tone={actionLabel[c.suggestedAction].tone}>{actionLabel[c.suggestedAction].label}</Pill>}
              </Link>
            ))}
          </div>
        </>
      )}
      <p style={{ marginTop: 18 }}><AsOf /></p>
    </div>
  );
}
