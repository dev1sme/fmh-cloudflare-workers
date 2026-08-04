import { Hono } from "hono";

import {
  clearSessionCookie,
  createSessionToken,
  currentUser,
  setSessionCookie,
  verifyPassword,
} from "../auth";
import { getUserByUsername } from "../db";
import type { AppEnv } from "../types";

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

  const token = await createSessionToken(c.env, { id: user.id, username: user.username });
  setSessionCookie(c, token);

  return c.json({ user: { id: user.id, username: user.username } });
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
