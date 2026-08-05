import { Hono } from "hono";

import { requirePhong, requireQuanLy } from "./auth";
import { chiTietValidation, failure, notFound, ok } from "./envelope";
import { securityHeaders } from "./headers";
import { countRooms } from "./db/rooms";
import { accountRoutes } from "./routes/accounts";
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

// First in the chain so it covers public routes, errors and 404s alike.
app.use("*", securityHeaders);

// Public.
app.get("/api/health", (c) => ok(c, { ok: true }, "Service is healthy."));
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
admin.get("/summary", async (c) =>
  ok(c, { user: c.get("user"), rooms: await countRooms(c.env.DB) }, "Summary retrieved."),
);
admin.route("/accounts", accountRoutes);
admin.route("/buildings", buildingRoutes);
admin.route("/rooms", roomRoutes);
admin.route("/tenants", tenantRoutes);
admin.route("/readings", readingRoutes);
admin.route("/invoices", invoiceRoutes);
admin.route("/payments", paymentRoutes);
app.route("/api", admin);

app.notFound((c) => notFound(c, "Endpoint not found."));

app.onError((err, c) => {
  if (err instanceof ValidationError) {
    // The code stays the contract; details name the offending field on top.
    return failure(
      c,
      err.message,
      "The given data was invalid.",
      400,
      chiTietValidation(err.message),
    );
  }

  // D1 surfaces schema violations as plain errors; map the ones that are the
  // caller's fault to 409 instead of a blanket 500.
  const message = err.message ?? "";
  if (message.includes("UNIQUE constraint failed")) {
    return failure(c, "trung_du_lieu", "Duplicate data.", 409);
  }
  if (message.includes("FOREIGN KEY constraint failed")) {
    return failure(c, "rang_buoc_du_lieu", "Related data still references this record.", 409);
  }
  if (message.includes("CHECK constraint failed")) {
    return failure(c, "du_lieu_khong_hop_le", "The given data was invalid.", 400);
  }

  // Logged, never returned: the convention forbids leaking internal messages.
  console.error(err);
  return failure(c, "loi_he_thong", "Internal server error.", 500);
});

export default app;
