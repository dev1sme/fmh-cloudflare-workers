import { Hono } from "hono";

import { requireAuth } from "./auth";
import { countRooms } from "./db";
import { authRoutes } from "./routes/auth";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// Public.
app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api/auth", authRoutes);

// Everything else under /api requires a session cookie.
const api = new Hono<AppEnv>();
api.use("*", requireAuth);

api.get("/summary", async (c) => {
  return c.json({
    user: c.get("user"),
    rooms: await countRooms(c.env.DB),
  });
});

app.route("/api", api);

app.notFound((c) => c.json({ error: "not_found" }, 404));

export default app;
