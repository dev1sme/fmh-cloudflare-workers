import { Hono } from "hono";

import { getInvoiceDetail, listInvoices } from "../db/invoices";
import { listReadings } from "../db/readings";
import { getTenantDashboard } from "../db/dashboard";
import { getRoom } from "../db/rooms";
import { CODE_PREFIX } from "../domain/code";
import { notFound, ok } from "../envelope";
import type { AppEnv } from "../types";
import { optionalPeriod, parseCode } from "../validate";

/**
 * Read-only view for a tenant account.
 *
 * Every query is scoped by `user.room_id` taken from the session token — the
 * room is never read from the request, so one tenant cannot reach another
 * room's invoices by guessing an id.
 */
export const meRoutes = new Hono<AppEnv>();

/** Meter usage and what was billed, month by month, for this tenant's room. */
meRoutes.get("/dashboard", async (c) =>
  ok(c, await getTenantDashboard(c.env.DB, c.get("user").room_id!), "Dashboard retrieved."),
);

// Singular: a tenant account is bound to exactly one room.
meRoutes.get("/room", async (c) => {
  const room = await getRoom(c.env.DB, c.get("user").room_id!);
  if (!room) return notFound(c, "Room not found.");

  return ok(c, { room }, "Room retrieved.");
});

meRoutes.get("/invoices", async (c) => {
  const invoices = await listInvoices(c.env.DB, {
    room_id: c.get("user").room_id!,
    period: optionalPeriod(c.req.query("period")),
  });

  return ok(c, { invoices }, "Invoices retrieved.");
});

meRoutes.get("/invoices/:code", async (c) => {
  const invoice = await getInvoiceDetail(c.env.DB, parseCode(CODE_PREFIX.invoice, c.req.param("code")));
  if (!invoice || invoice.room_id !== c.get("user").room_id) {
    // 404, not 403 — another room's invoice must not be probeable, and the
    // code being random means there is nothing to walk through anyway.
    return notFound(c, "Invoice not found.");
  }

  return ok(c, { invoice }, "Invoice retrieved.");
});

meRoutes.get("/readings", async (c) => {
  const readings = await listReadings(c.env.DB, {
    room_id: c.get("user").room_id!,
    period: optionalPeriod(c.req.query("period")),
  });

  return ok(c, { readings }, "Readings retrieved.");
});
