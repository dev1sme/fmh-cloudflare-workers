import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { SignJWT, jwtVerify } from "jose";

import type { AppEnv, SessionUser } from "./types";

export const SESSION_COOKIE = "session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Password records look like `pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>`.
 *
 * The iteration count lives inside the record, so raising it later only means
 * re-running scripts/hash-password.mjs — old records keep verifying with their
 * own count and no migration is needed.
 *
 * 50k is well below the OWASP recommendation (600k) on purpose: Workers Free
 * allows 10 ms of CPU per request and 600k iterations measures ~65 ms. Long
 * random passwords, not the iteration count, are what carry the weight here.
 */
export async function verifyPassword(password: string, record: string): Promise<boolean> {
  const parts = record.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") return false;

  const iterations = Number(parts[2]);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  const salt = decodeBase64(parts[3]);
  const expected = decodeBase64(parts[4]);
  if (!salt || !expected || expected.length === 0) return false;

  const actual = await deriveBits(password, salt, iterations, expected.length * 8);
  return timingSafeEqual(actual, expected);
}

async function deriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number,
  lengthInBits: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    lengthInBits,
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

function decodeBase64(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function secretKey(env: Env): Uint8Array {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set — add it to .dev.vars locally or `wrangler secret put`");
  }
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function createSessionToken(env: Env, user: SessionUser): Promise<string> {
  return new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey(env));
}

export async function readSessionToken(env: Env, token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(env), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    const username = payload.username;
    if (!Number.isInteger(id) || typeof username !== "string") return null;
    return { id, username };
  } catch {
    return null;
  }
}

export function setSessionCookie(c: Context<AppEnv>, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(c: Context<AppEnv>): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/", secure: true, sameSite: "Lax" });
}

/** Reads the session cookie without rejecting the request. */
export async function currentUser(c: Context<AppEnv>): Promise<SessionUser | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  return readSessionToken(c.env, token);
}

/** Rejects the request with 401 unless a valid session cookie is present. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  c.set("user", user);
  await next();
});
