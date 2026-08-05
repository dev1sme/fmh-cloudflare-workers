import { Hono } from "hono";

import {
  PBKDF2_ITERATIONS,
  clearSessionCookie,
  createSessionToken,
  currentUser,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "../auth";
import { getUserByUsername, setPasswordHash } from "../db/users";
import { DO_DAI_TOI_THIEU } from "../domain/password";
import { failure, notFound, ok } from "../envelope";
import type { AppEnv, SessionUser } from "../types";
import { fail, jsonBody, requireString } from "../validate";

/**
 * Verified when the username does not exist, so a wrong username and a wrong
 * password cost the same time and cannot be told apart from the outside.
 * Password is a random string nobody holds.
 *
 * The iteration count is interpolated from PBKDF2_ITERATIONS rather than
 * written out. Hard-coding it once left this record at 50k against real
 * records at 10k, which broke the property this whole record exists for: on
 * the deployed Worker a miss cost 10-26 ms of CPU against 5 ms for a hit, so
 * the timing told an attacker which usernames exist — and the miss went over
 * the 10 ms limit on Workers Free at the same time.
 */
const DUMMY_RECORD = `pbkdf2$sha256$${PBKDF2_ITERATIONS}$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`;

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json<{ username?: unknown; password?: unknown }>().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return failure(c, "MISSING_CREDENTIALS", "Username and password are required.", 400);
  }

  const user = await getUserByUsername(c.env.DB, username);
  const dung = await verifyPassword(password, user?.password_hash ?? DUMMY_RECORD);

  if (!user || !dung) {
    return failure(c, "INVALID_CREDENTIALS", "Wrong username or password.", 401);
  }

  const session: SessionUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    room_id: user.role === "MANAGER" ? null : user.room_id,
  };

  setSessionCookie(c, await createSessionToken(c.env, session));

  return ok(c, { user: session }, "Signed in.");
});

authRoutes.post("/logout", (c) => {
  clearSessionCookie(c);
  return ok(c, { ok: true }, "Signed out.");
});

authRoutes.get("/me", async (c) => {
  const user = await currentUser(c);
  if (!user) return failure(c, "UNAUTHORIZED", "Authentication required.", 401);

  return ok(c, { user }, "Session retrieved.");
});

/**
 * Self-service change, for tenants and the manager alike.
 *
 * Unlike the manager's reset this *does* require the current password: the
 * session cookie alone should not be enough to lock the real owner out if a
 * logged-in device is left unattended.
 */
authRoutes.post("/change-password", async (c) => {
  const session = await currentUser(c);
  if (!session) return failure(c, "UNAUTHORIZED", "Authentication required.", 401);

  const body = await jsonBody(c.req);
  const matKhauCu = requireString(body.mat_khau_cu, "mat_khau_cu", 200);
  const matKhauMoi = requireString(body.mat_khau_moi, "mat_khau_moi", 200);

  if (matKhauMoi.length < DO_DAI_TOI_THIEU) fail("PASSWORD_TOO_SHORT");

  const user = await getUserByUsername(c.env.DB, session.username);
  if (!user) return notFound(c, "Account not found.");

  if (!(await verifyPassword(matKhauCu, user.password_hash))) {
    return failure(c, "WRONG_CURRENT_PASSWORD", "The current password is wrong.", 400);
  }

  await setPasswordHash(c.env.DB, user.id, await hashPassword(matKhauMoi));

  return ok(c, { ok: true }, "Password changed.");
});
