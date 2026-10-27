import { randomUUID } from "node:crypto";
import type { ZetarisConfig, ZetarisQueryResult, ZetarisSession } from "./types.js";

const JWT_PATTERN = /[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/;
const ORG_ID_PATTERN = /"orgId"\s*:\s*(\d+)/;

/**
 * Client for the LOCAL Zetaris Docker Compose platform. The route shapes
 * below are not guessed from the generic public kbase docs — they are
 * read directly from the bundled `zetaris-platform/verify.sh`, the
 * vendor's own smoke test, which is the actual working contract for this
 * deployment: login through the UI's proxy, then a SQL query through the
 * same proxy with the returned token/org id. PRD §11.1 warns never to
 * guess endpoint paths; this doesn't — it transcribes a verified source.
 *
 * UNVERIFIED until a real request against a running platform succeeds —
 * see docs/INTEGRATIONS.md. Do not report Zetaris integration as complete
 * based on this client compiling; it must actually be called successfully.
 */
export class ZetarisClient {
  private session: ZetarisSession | null = null;

  constructor(private readonly config: ZetarisConfig) {}

  async login(): Promise<ZetarisSession> {
    const response = await fetch(`${this.config.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: this.config.username, password: this.config.password }),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Zetaris login failed: ${response.status} ${response.statusText} — ${text}`);
    }

    const tokenMatch = text.match(JWT_PATTERN);
    const orgIdMatch = text.match(ORG_ID_PATTERN);
    if (!tokenMatch || !orgIdMatch) {
      throw new Error(`Zetaris login response missing token or orgId: ${text.slice(0, 200)}`);
    }

    this.session = { token: tokenMatch[0], orgId: orgIdMatch[1]! };
    return this.session;
  }

  /**
   * Executes a SQL query through the local platform's query proxy. Callers
   * must use fixed server-side query templates with validated parameters,
   * never string-interpolate untrusted input into `sql` (PRD §16.1 SQL
   * injection control) — this client does not sanitize `sql` itself.
   */
  async query(sql: string, pageLimit = 100): Promise<ZetarisQueryResult> {
    if (!this.session) await this.login();
    const session = this.session!;
    const requestId = randomUUID();
    const startedAt = Date.now();

    const response = await fetch(`${this.config.baseUrl}/api/proxy/query/sql/start`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.token}`,
        "x-org-id": session.orgId,
        "x-request-id": requestId,
      },
      body: JSON.stringify({ select: sql, pageLimit }),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Zetaris query failed: ${response.status} ${response.statusText} — ${text}`);
    }

    // Real field names confirmed live against the local platform
    // (docs/INTEGRATIONS.md) — the response uses `records`, not `rows`,
    // and carries real pagination state including a resumable queryToken.
    const body = JSON.parse(text) as {
      records?: Array<Record<string, string>>;
      pageNumber?: number;
      pageLimit?: number;
      totalCount?: number;
      totalPages?: number;
      queryToken?: string;
    };
    const rows = body.records ?? [];

    return {
      rows,
      rowCount: rows.length,
      requestId,
      durationMs: Date.now() - startedAt,
      pageNumber: body.pageNumber ?? 1,
      pageLimit: body.pageLimit ?? pageLimit,
      totalCount: body.totalCount ?? rows.length,
      totalPages: body.totalPages ?? 1,
      queryToken: body.queryToken ?? null,
    };
  }
}
