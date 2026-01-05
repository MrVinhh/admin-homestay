import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

export type SessionPayload = {
  email: string;
  exp: number; // unix seconds
};

type User = {
  email: string;
  password: string; // demo only (plaintext). For prod: store hashed.
  role?: "admin" | "staff";
};

// ✅ Acc có sẵn trong code
const USERS: User[] = [
  { email: "admin@gmail.com", password: "admin123", role: "admin" },
  { email: "staff@gmail.com", password: "staff123", role: "staff" },
];

// ✅ Gmail “được phép” (allowlist) — demo: không cần password
const ALLOWED_GMAILS = new Set<string>(["you@gmail.com", "another@gmail.com"]);

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Missing SESSION_SECRET in .env.local");
  return s;
}

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(data: string) {
  return base64url(
    crypto.createHmac("sha256", getSecret()).update(data).digest()
  );
}

function encodeSession(payload: SessionPayload) {
  const json = JSON.stringify(payload);
  const b64 = base64url(json);
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;

  const expected = sign(b64);

  // timing safe compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    // base64url -> base64
    const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;

    if (!payload?.email || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function isGmail(email: string) {
  return /^[^\s@]+@gmail\.com$/i.test(email.trim());
}

export function verifyLogin(emailRaw: string, passwordRaw?: string) {
  const email = emailRaw.trim().toLowerCase();
  const password = (passwordRaw ?? "").trim();

  if (!isGmail(email)) {
    return { ok: false as const, reason: "Chỉ cho phép Gmail (@gmail.com)." };
  }

  // 1) ưu tiên check user có sẵn trong code
  const user = USERS.find((u) => u.email.toLowerCase() === email);
  if (user) {
    if (user.password !== password) {
      return { ok: false as const, reason: "Sai mật khẩu." };
    }
    return { ok: true as const, email, role: user.role ?? "admin" };
  }

  // 2) nếu email nằm trong allowlist “đã đăng ký”
  if (ALLOWED_GMAILS.has(email)) {
    // Demo: không bắt password
    return { ok: true as const, email, role: "staff" as const };
  }

  return { ok: false as const, reason: "Email chưa được đăng ký/cho phép." };
}

// ✅ Next mới: cookies() async => phải await
export async function setSession(email: string) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8; // 8h
  const token = encodeSession({ email, exp });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

// ✅ helper cho middleware (middleware không dùng cookies() được)
export function getSessionFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match?.[1]) return null;
  return decodeSession(match[1]);
}
