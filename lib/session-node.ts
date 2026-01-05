import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { COOKIE_NAME, SESSION_TTL_SECONDS } from "../lib/session-constants";

export type SessionPayload = {
  email: string;
  exp: number; // unix seconds
};

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Missing SESSION_SECRET in .env.local");
  return s;
}

function base64urlFromBuffer(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlFromString(str: string) {
  return base64urlFromBuffer(Buffer.from(str, "utf8"));
}

function bufferFromBase64url(b64url: string) {
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 ? "=".repeat(4 - (base64.length % 4)) : "";
  return Buffer.from(base64 + pad, "base64");
}

function sign(data: string) {
  const digest = crypto.createHmac("sha256", getSecret()).update(data).digest();
  return base64urlFromBuffer(digest);
}

function encodeSession(payload: SessionPayload) {
  const b64 = base64urlFromString(JSON.stringify(payload));
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
    const json = bufferFromBase64url(b64).toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload?.email || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSession(email: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
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
