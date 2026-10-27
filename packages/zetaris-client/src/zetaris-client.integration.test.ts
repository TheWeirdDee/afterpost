import { describe, expect, it } from "vitest";
import { ZetarisClient } from "./zetaris-client.js";

/**
 * Live integration test against the local Zetaris Docker Compose platform
 * (see ~/zetaris-platform, provisioned from the official
 * zetaris-platform.zip). Requires ZETARIS_ADMIN_PASSWORD in the
 * environment — per PRD §18.2, when credentials are unavailable this
 * suite is SKIPPED, never silently treated as passing.
 *
 * Confirmed live 2026-10-27: the real response shape uses `records` (not
 * `rows`) plus real pagination fields (pageNumber, pageLimit, totalCount,
 * totalPages, queryToken) — this was NOT documented anywhere public; it
 * was discovered by inspecting the raw response, which is why the client
 * decodes it that way. See docs/INTEGRATIONS.md for the full evidence.
 */
const hasCredentials = Boolean(process.env.ZETARIS_ADMIN_PASSWORD);

describe.skipIf(!hasCredentials)("ZetarisClient (live local platform)", () => {
  const client = new ZetarisClient({
    baseUrl: "http://localhost:3000",
    username: "admin@zetaris.com",
    password: process.env.ZETARIS_ADMIN_PASSWORD ?? "",
  });

  it("logs in and runs a basic query through the real stack (ui -> api -> driver -> spark)", async () => {
    // #given / #when
    const result = await client.query("select 7 as seven", 5);
    // #then
    expect(result.rows).toEqual([{ seven: "7" }]);
    expect(result.queryToken).toBeTruthy();
  }, 15_000);

  it("runs a genuine federated query across two independently registered sources — the PRD §11.1 sponsor-removal test", async () => {
    // #given — NY_TAXI (CSV, bootstrapped from S3) and TPCDS_DB (Parquet,
    // bootstrapped from S3) are registered as two physically distinct
    // sources; this is not a disguised local join.
    // #when
    const result = await client.query(
      `SELECT c.customer_type, d.d_year, COUNT(*) as n
         FROM NY_TAXI.customers c
         JOIN TPCDS_DB.date_dim d ON d.d_year = 2021
         GROUP BY c.customer_type, d.d_year
         LIMIT 10`,
      10,
    );
    // #then — a real result computed by Spark across both sources, not
    // an empty/fabricated set
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0]).toHaveProperty("customer_type");
    expect(result.rows[0]).toHaveProperty("n");
  }, 60_000);
});
