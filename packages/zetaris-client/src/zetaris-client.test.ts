import { afterEach, describe, expect, it, vi } from "vitest";
import { ZetarisClient } from "./zetaris-client.js";

describe("ZetarisClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses the token and orgId out of a realistic login response", async () => {
    // #given — shape mirrors the bundled verify.sh's own tolerant parsing
    const fakeFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () =>
        JSON.stringify({
          accessToken: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.abc123signature",
          orgId: 1,
        }),
    });
    vi.stubGlobal("fetch", fakeFetch);
    const client = new ZetarisClient({ baseUrl: "http://localhost:3000", username: "a", password: "b" });
    // #when
    const session = await client.login();
    // #then
    expect(session.orgId).toBe("1");
    expect(session.token).toContain(".");
    expect(fakeFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws rather than silently returning an empty session on a failed login", async () => {
    // #given
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, status: 401, statusText: "Unauthorized", text: async () => "nope" }),
    );
    const client = new ZetarisClient({ baseUrl: "http://localhost:3000", username: "a", password: "wrong" });
    // #when / #then
    await expect(client.login()).rejects.toThrow(/Zetaris login failed/);
  });

  it("queries using the session token and org id, matching verify.sh's own contract", async () => {
    // #given
    const fakeFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ accessToken: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.abc123signature", orgId: 7 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ rows: [{ seven: "7" }] }),
      });
    vi.stubGlobal("fetch", fakeFetch);
    const client = new ZetarisClient({ baseUrl: "http://localhost:3000", username: "a", password: "b" });
    // #when
    const result = await client.query("select 7 as seven", 5);
    // #then
    expect(result.rows).toEqual([{ seven: "7" }]);
    expect(result.rowCount).toBe(1);
    const queryCall = fakeFetch.mock.calls[1]!;
    expect(queryCall[0]).toBe("http://localhost:3000/api/proxy/query/sql/start");
    const headers = (queryCall[1] as RequestInit).headers as Record<string, string>;
    expect(headers["x-org-id"]).toBe("7");
    expect(headers.authorization).toBe(
      "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.abc123signature",
    );
  });
});
