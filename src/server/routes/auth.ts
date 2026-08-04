import { Hono } from "hono";

import {
  clearSessionCookie,
  createSessionToken,
  currentUser,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "../auth";
import { getUserByUsername, setPasswordHash } from "../db/users";
import { DO_DAI_TOI_THIEU } from "../domain/password";
import type { AppEnv, SessionUser } from "../types";
import { fail, jsonBody, requireString } from "../validate";

/**
 * Verified when the username does not exist, so a wrong username and a wrong
 * password cost the same time and cannot be told apart from the outside.
 * Password is a random string nobody holds.
 */
const DUMMY_RECORD =
  "pbkdf2$sha256$50000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json<{ username?: unknown; password?: unknown }>().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return c.json({ error: "missing_credentials" }, 400);
  }

  const user = await getUserByUsername(c.env.DB, username);
  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_RECORD);

  if (!user || !ok) {
    return c.json({ error: "invalid_credentials" }, 401);
  }

  const session: SessionUser = {
    id: user.id,
    username: user.username,
    vai_tro: user.vai_tro,
    room_id: user.vai_tro === "quan_ly" ? null : user.room_id,
  };

  setSessionCookie(c, await createSessionToken(c.env, session));

  return c.json({ user: session });
});

authRoutes.post("/logout", (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  return c.json({ user });
});

/**
 * Self-service change, for tenants and the manager alike.
 *
 * Unlike the manager's reset this *does* require the current password: the
 * session cookie alone should not be enough to lock the real owner out if a
 * logged-in device is left unattended.
 */
authRoutes.post("/doi-mat-khau", async (c) => {
  const session = await currentUser(c);
  if (!session) return c.json({ error: "unauthorized" }, 401);

  const body = await jsonBody(c.req);
  const matKhauCu = requireString(body.mat_khau_cu, "mat_khau_cu", 200);
  const matKhauMoi = requireString(body.mat_khau_moi, "mat_khau_moi", 200);

  if (matKhauMoi.length < DO_DAI_TOI_THIEU) fail("password_qua_ngan");

  const user = await getUserByUsername(c.env.DB, session.username);
  if (!user) return c.json({ error: "not_found" }, 404);

  if (!(await verifyPassword(matKhauCu, user.password_hash))) {
    return c.json({ error: "sai_mat_khau_cu" }, 400);
  }

  await setPasswordHash(c.env.DB, user.id, await hashPassword(matKhauMoi));

  return c.json({ ok: true });
});
