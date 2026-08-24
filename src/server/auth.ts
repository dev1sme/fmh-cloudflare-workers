import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { SignJWT, jwtVerify } from "jose";

import { decodeBase64, encodeBase64 } from "./domain/crypto";
import { failure } from "./envelope";
import type { AppEnv, Role, SessionUser } from "./types";

const ROLES: readonly Role[] = ["MANAGER", "TENANT"];

export const SESSION_COOKIE = "session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Password records look like `pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>`.
 *
 * The iteration count lives inside the record, so changing it later only means
 * re-hashing — old records keep verifying with their own count and no migration
 * is needed. Changing it does NOT speed up existing accounts until their
 * passwords are reset.
 *
 * 10k is far below the OWASP recommendation (600k) on purpose. Workers Free
 * allows 10 ms of CPU per request. Measured on the deployed Worker (wrangler
 * tail, cpuTime): 50k iterations cost 11-17 ms — over the limit on every single
 * login. At 10k a warm login is 2-3 ms, median 8 ms, occasionally spiking to 13
 * on a cold isolate. Do not trust a local benchmark here: this dev machine ran
 * 50k in ~6 ms, three times faster than Cloudflare's CPU.
 *
 * Long random passwords, not the iteration count, are what carry the weight in
 * this app. If you raise this, re-measure on the deployed Worker, not locally.
 */
export const PBKDF2_ITERATIONS = 10_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

/**
 * Hashes a new password. Runs on the Worker so the manager can create accounts
 * and reset passwords from the UI. scripts/hash-password.mjs produces the
 * identical format offline for bootstrapping the first account — keep the two
 * iteration counts in step.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveBits(password, salt, PBKDF2_ITERATIONS, KEY_BITS);

  return ["pbkdf2", "sha256", PBKDF2_ITERATIONS, encodeBase64(salt), encodeBase64(hash)].join("$");
}

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

/**
 * Compares two secrets without letting the time taken reveal how much of the
 * guess was right. Exported for the SePay webhook, which compares signatures
 * and must not leak one a byte at a time.
 */
export function soSanhBiMat(a: string, b: string): boolean {
  const enc = new TextEncoder();
  return timingSafeEqual(enc.encode(a), enc.encode(b));
}

/**
 * HMAC-SHA256 as lowercase hex, the shape SePay signs its webhooks with.
 *
 * Web Crypto rather than Node's `crypto`, same as everything else here — the
 * Worker runtime has no Node crypto module.
 */
export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

function secretKey(env: Env): Uint8Array {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set — add it to .dev.vars locally or `wrangler secret put`");
  }
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function createSessionToken(env: Env, user: SessionUser): Promise<string> {
  return new SignJWT({
    username: user.username,
    role: user.role,
    room_id: user.room_id,
  })
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
    const { username, role: role, room_id: roomId } = payload;

    if (!Number.isInteger(id)) return null;
    if (typeof username !== "string") return null;
    if (typeof role !== "string" || !ROLES.includes(role as Role)) return null;

    // A tenant token without a room would authorise nothing; a manager token
    // with one would silently scope queries. Reject both rather than guess.
    const isManager = role === "MANAGER";
    if (isManager && roomId !== null) return null;
    if (!isManager && (typeof roomId !== "number" || !Number.isInteger(roomId))) return null;

    return {
      id,
      username,
      role: role as Role,
      room_id: isManager ? null : (roomId as number),
    };
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

/** Management endpoints: everything that writes to rooms, readings or money. */
export const requireQuanLy = createMiddleware<AppEnv>(async (c, next) => {
  const user = await currentUser(c);
  if (!user) return failure(c, "UNAUTHORIZED", "Authentication required.", 401);
  if (user.role !== "MANAGER") {
    return failure(c, "FORBIDDEN", "Manager role required.", 403);
  }

  c.set("user", user);
  await next();
});

/**
 * Tenant endpoints under /api/me. The room always comes from the token, never
 * from the request, so one tenant cannot read another room's invoices.
 */
export const requirePhong = createMiddleware<AppEnv>(async (c, next) => {
  const user = await currentUser(c);
  if (!user) return failure(c, "UNAUTHORIZED", "Authentication required.", 401);
  if (user.room_id === null) {
    return failure(c, "NO_ROOM_BOUND", "This account is not bound to a room.", 403);
  }

  c.set("user", user);
  await next();
});
