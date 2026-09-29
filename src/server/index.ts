import { Hono } from "hono";

import { requireTenant, requireManager } from "./auth";
import { validationDetails, failure, notFound, ok } from "./envelope";
import { securityHeaders } from "./headers";
import { getDashboard } from "./db/dashboard";
import { getRevenueReport } from "./db/reports";
import { currentPeriod } from "./domain/period";
import { optionalPeriod, optionalYear } from "./validate";
import { accountRoutes } from "./routes/accounts";
import { authRoutes } from "./routes/auth";
import { botRoutes, botTargetRoutes } from "./routes/bots";
import { buildingRoutes } from "./routes/buildings";
import { invoiceRoutes } from "./routes/invoices";
import { meRoutes } from "./routes/me";
import { paymentRoutes } from "./routes/payments";
import { readingRoutes } from "./routes/readings";
import { roomRoutes } from "./routes/rooms";
import { tenantRoutes } from "./routes/tenants";
import { webhookRoutes } from "./routes/webhook";
import type { AppEnv } from "./types";
import { ValidationError } from "./validate";

const app = new Hono<AppEnv>();

/**
 * Wraps a resource router in the manager guard **at its own mount point**.
 *
 * The shape this replaces was one sub-app carrying `use("*", requireManager)`
 * and mounted on `/api`. It worked, but only because of registration order:
 * `/api/health`, `/api/auth/*` and `/api/me/*` stayed reachable purely by being
 * registered above it, and a public route added below would have started
 * answering 401 with nothing in the file to point at. Ordering was load-bearing
 * for authorisation, which is not a property to leave lying around.
 *
 * Each mount now carries its own guard over its own prefix, so no path falls
 * under a wildcard meant for a different one and the order of these lines no
 * longer decides who can call what.
 */
function managerOnly(routes: Hono<AppEnv>): Hono<AppEnv> {
  const guarded = new Hono<AppEnv>();
  guarded.use("*", requireManager);
  guarded.route("/", routes);
  return guarded;
}

// First in the chain so it covers public routes, errors and 404s alike.
app.use("*", securityHeaders);

// Public.
app.get("/api/health", (c) => ok(c, { ok: true }, "Service is healthy."));
app.route("/api/auth", authRoutes);

// SePay calls this with a signature, not a session cookie, so it cannot sit
// under `requireManager`. It authenticates itself before touching anything.
//
// Outside /api on purpose — it is not part of the app's API surface and no
// client calls it. `run_worker_first` in wrangler.toml has to list /hooks/*
// for this to be reachable at all.
app.route("/hooks", webhookRoutes);

// Tenant accounts: read-only, always scoped to the room in their token.
const me = new Hono<AppEnv>();
me.use("*", requireTenant);
me.route("/", meRoutes);
app.route("/api/me", me);

// Management: everything that writes to rooms, readings or money. The rollup is
// a single handler, so it takes the middleware inline rather than a sub-app of
// one route.

/** Revenue, debt, occupancy and usage for one period. Defaults to this month. */
app.get("/api/dashboard", requireManager, async (c) => {
  const period = optionalPeriod(c.req.query("period")) ?? currentPeriod();
  return ok(c, await getDashboard(c.env.DB, period), "Dashboard retrieved.");
});

/**
 * Revenue for one calendar year, broken down by month, building and room, plus
 * every year's totals for comparison. Defaults to this year. Read-only, and a
 * single handler like the dashboard, so the guard sits inline.
 */
app.get("/api/reports/revenue", requireManager, async (c) => {
  const year = optionalYear(c.req.query("year")) ?? Number(currentPeriod().slice(0, 4));
  return ok(c, await getRevenueReport(c.env.DB, year), "Revenue report retrieved.");
});

app.route("/api/accounts", managerOnly(accountRoutes));
app.route("/api/buildings", managerOnly(buildingRoutes));
app.route("/api/rooms", managerOnly(roomRoutes));
app.route("/api/tenants", managerOnly(tenantRoutes));
app.route("/api/readings", managerOnly(readingRoutes));
app.route("/api/invoices", managerOnly(invoiceRoutes));
app.route("/api/payments", managerOnly(paymentRoutes));
// Notification bots and their destinations. Two mounts because a target is
// addressed by its own code, not nested under the bot's — `PATCH
// /bot-targets/TG…` beats threading the bot code through a path that already
// identifies the row uniquely.
app.route("/api/bots", managerOnly(botRoutes));
app.route("/api/bot-targets", managerOnly(botTargetRoutes));

app.notFound((c) => notFound(c, "Endpoint not found."));

app.onError((err, c) => {
  if (err instanceof ValidationError) {
    // The code stays the contract; details name the offending field on top.
    return failure(
      c,
      err.message,
      "The given data was invalid.",
      400,
      validationDetails(err.message),
    );
  }

  // D1 surfaces schema violations as plain errors; map the ones that are the
  // caller's fault to 409 instead of a blanket 500.
  const message = err.message ?? "";
  if (message.includes("UNIQUE constraint failed")) {
    return failure(c, "DUPLICATE_DATA", "Duplicate data.", 409);
  }
  if (message.includes("FOREIGN KEY constraint failed")) {
    return failure(c, "RELATED_DATA_EXISTS", "Related data still references this record.", 409);
  }
  if (message.includes("CHECK constraint failed")) {
    return failure(c, "INVALID_DATA", "The given data was invalid.", 400);
  }

  // Logged, never returned: the convention forbids leaking internal messages.
  console.error(err);
  return failure(c, "INTERNAL_ERROR", "Internal server error.", 500);
});

export default app;
