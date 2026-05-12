// HMAC-signed session tokens. Edge-runtime compatible (Web Crypto only).
//
// Token format: <expiry-ms>.<hmac-hex>
// Secret: SESSION_SECRET, or DASHBOARD_PASSWORD as a fallback so users with
// the minimal config still get working sessions.

export const SESSION_COOKIE = "sespulse_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  return (
    process.env.SESSION_SECRET || process.env.DASHBOARD_PASSWORD || ""
  );
}

export function isAuthEnabled(): boolean {
  return Boolean(process.env.DASHBOARD_USER && process.env.DASHBOARD_PASSWORD);
}

async function hmacHex(message: string): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("Session secret is not configured");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + SESSION_TTL_MS;
  const sig = await hmacHex(String(exp));
  return `${exp}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  let expected: string;
  try {
    expected = await hmacHex(expStr);
  } catch {
    return false;
  }
  if (sig.length !== expected.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
