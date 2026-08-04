import { Hono } from "hono";

import { getInvoiceDetail, listInvoices } from "../db/invoices";
import { listReadings } from "../db/readings";
import { getRoom } from "../db/rooms";
import type { AppEnv } from "../types";
import { optionalKy, parseId } from "../validate";

/**
 * Read-only view for a tenant account.
 *
 * Every query is scoped by `user.room_id` taken from the session token — the
 * room is never read from the request, so one tenant cannot reach another
 * room's invoices by guessing an id.
 */
export const meRoutes = new Hono<AppEnv>();

meRoutes.get("/phong", async (c) => {
  const room = await getRoom(c.env.DB, c.get("user").room_id!);
  if (!room) return c.json({ error: "not_found" }, 404);

  return c.json({ room });
});

meRoutes.get("/invoices", async (c) => {
  const invoices = await listInvoices(c.env.DB, {
    room_id: c.get("user").room_id!,
    ky: optionalKy(c.req.query("ky")),
  });

  return c.json({ invoices });
});

meRoutes.get("/invoices/:id", async (c) => {
  const invoice = await getInvoiceDetail(c.env.DB, parseId(c.req.param("id")));
  if (!invoice || invoice.room_id !== c.get("user").room_id) {
    return c.json({ error: "not_found" }, 404);
  }

  return c.json({ invoice });
});

meRoutes.get("/readings", async (c) => {
  const readings = await listReadings(c.env.DB, {
    room_id: c.get("user").room_id!,
    ky: optionalKy(c.req.query("ky")),
  });

  return c.json({ readings });
});
