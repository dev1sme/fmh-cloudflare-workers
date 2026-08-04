import { Hono } from "hono";

import { requirePhong, requireQuanLy } from "./auth";
import { countRooms } from "./db/rooms";
import { authRoutes } from "./routes/auth";
import { buildingRoutes } from "./routes/buildings";
import { invoiceRoutes } from "./routes/invoices";
import { meRoutes } from "./routes/me";
import { paymentRoutes } from "./routes/payments";
import { readingRoutes } from "./routes/readings";
import { roomRoutes } from "./routes/rooms";
import { tenantRoutes } from "./routes/tenants";
import type { AppEnv } from "./types";
import { ValidationError } from "./validate";

const app = new Hono<AppEnv>();

// Public.
app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api/auth", authRoutes);

// Tenant accounts: read-only, always scoped to the room in their token.
// Registered before the management sub-app so /api/me/* is not swallowed by it.
const me = new Hono<AppEnv>();
me.use("*", requirePhong);
me.route("/", meRoutes);
app.route("/api/me", me);

// Management: everything that writes to rooms, readings or money.
const admin = new Hono<AppEnv>();
admin.use("*", requireQuanLy);
admin.get("/summary", async (c) => c.json({ user: c.get("user"), rooms: await countRooms(c.env.DB) }));
admin.route("/buildings", buildingRoutes);
admin.route("/rooms", roomRoutes);
admin.route("/tenants", tenantRoutes);
admin.route("/readings", readingRoutes);
admin.route("/invoices", invoiceRoutes);
admin.route("/payments", paymentRoutes);
app.route("/api", admin);

app.notFound((c) => c.json({ error: "not_found" }, 404));

app.onError((err, c) => {
  if (err instanceof ValidationError) {
    return c.json({ error: err.message }, 400);
  }

  // D1 surfaces schema violations as plain errors; map the ones that are the
  // caller's fault to 409 instead of a blanket 500.
  const message = err.message ?? "";
  if (message.includes("UNIQUE constraint failed")) return c.json({ error: "trung_du_lieu" }, 409);
  if (message.includes("FOREIGN KEY constraint failed")) {
    return c.json({ error: "rang_buoc_du_lieu" }, 409);
  }
  if (message.includes("CHECK constraint failed")) return c.json({ error: "du_lieu_khong_hop_le" }, 400);

  console.error(err);
  return c.json({ error: "loi_he_thong" }, 500);
});

export default app;
