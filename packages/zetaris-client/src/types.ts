export interface ZetarisConfig {
  /** e.g. http://localhost:3000 for the local Docker Compose platform. */
  baseUrl: string;
  username: string;
  password: string;
}

export interface ZetarisSession {
  token: string;
  orgId: string;
}

export interface ZetarisQueryResult {
  rows: ReadonlyArray<Record<string, string>>;
  rowCount: number;
  requestId: string;
  durationMs: number;
}
