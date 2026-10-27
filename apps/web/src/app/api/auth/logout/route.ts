import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL, SESSION_COOKIE_NAME } from "@/lib/api-config";

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await fetch(`${API_BASE_URL}/v1/auth/logout`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    }).catch(() => {
      // Best-effort server-side revocation; the cookie is cleared either way.
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
