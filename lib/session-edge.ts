import { COOKIE_NAME } from "../lib/session-constants";

type SessionPayload = { email: string; exp: number };

function base64urlFromBytes(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  const b64 = btoa(s);
  return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function bytesFromBase64url(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function textFromBase64url(b64url: string) {
  return new TextDecoder().decode(bytesFromBase64url(b64url));
}

async function hmacSha256Base64url(secret: string, data: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return base64urlFromBytes(new Uint8Array(sig));
}

export async function verifySessionEdge(
  token: string
): Promise<SessionPayload | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET in .env.local");

  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;

  const expected = await hmacSha256Base64url(secret, b64);
  if (sig !== expected) return null;

  try {
    const json = textFromBase64url(b64);
    const payload = JSON.parse(json) as SessionPayload;

    if (!payload?.email || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
