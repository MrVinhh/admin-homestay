import { NextResponse } from "next/server";
import { setSession, verifyLogin } from "../../../../lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email ?? "";
  const password = body?.password ?? "";

  const result = verifyLogin(email, password);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.reason },
      { status: 401 }
    );
  }

  await setSession(result.email);
  return NextResponse.json({ ok: true });
}
