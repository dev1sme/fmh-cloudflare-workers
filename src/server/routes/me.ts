import { Hono } from "hono";

import { getInvoiceDetail, listInvoices } from "../db/invoices";
import { listReadings } from "../db/readings";
import { getRoom } from "../db/rooms";
import { notFound, ok } from "../envelope";
import type { AppEnv } from "../types";
import { optionalPeriod, parseId } from "../validate";

/**
 * Read-only view for a tenant account.
 *
 * Every query is scoped by `user.room_id` taken from the session token — the
 * room is never read from the request, so one tenant cannot reach another
 * room's invoices by guessing an id.
 */
export const meRoutes = new Hono<AppEnv>();

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

meRoutes.get("/invoices/:id", async (c) => {
  const invoice = await getInvoiceDetail(c.env.DB, parseId(c.req.param("id")));
  if (!invoice || invoice.room_id !== c.get("user").room_id) {
    // 404, not 403 — another room's invoice must not be probeable by id.
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
