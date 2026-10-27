import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL, SESSION_COOKIE_NAME } from "@/lib/api-config";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_FAILED", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const apiResponse = await fetch(`${API_BASE_URL}/v1/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await apiResponse.json();
  if (!apiResponse.ok) {
    return NextResponse.json(data, { status: apiResponse.status });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(data.expiresAt),
  });

  return NextResponse.json({ user: data.user }, { status: 201 });
}
