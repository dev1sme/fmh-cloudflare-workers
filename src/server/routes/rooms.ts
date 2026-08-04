import { Hono } from "hono";

import { createRoom, deleteRoom, getRoom, listRooms, updateRoom } from "../db/rooms";
import type { AppEnv } from "../types";
import {
  jsonBody,
  optionalArea,
  optionalInt,
  parseId,
  requireId,
  requireInt,
  requireString,
} from "../validate";

export const roomRoutes = new Hono<AppEnv>();

roomRoutes.get("/", async (c) => c.json({ rooms: await listRooms(c.env.DB) }));

roomRoutes.get("/:id", async (c) => {
  const room = await getRoom(c.env.DB, parseId(c.req.param("id")));
  if (!room) return c.json({ error: "not_found" }, 404);

  return c.json({ room });
});

roomRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const room = await createRoom(c.env.DB, {
    building_id: requireId(body.building_id, "building_id"),
    ten_phong: requireString(body.ten_phong, "ten_phong", 50),
    gia_phong: requireInt(body.gia_phong, "gia_phong"),
    dien_tich: optionalArea(body.dien_tich, "dien_tich"),
  });

  return c.json({ room }, 201);
});

roomRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = await jsonBody(c.req);

  const room = await updateRoom(c.env.DB, id, {
    building_id: body.building_id === undefined ? undefined : requireId(body.building_id, "building_id"),
    ten_phong:
      body.ten_phong === undefined ? undefined : requireString(body.ten_phong, "ten_phong", 50),
    gia_phong: optionalInt(body.gia_phong, "gia_phong"),
    dien_tich: body.dien_tich === undefined ? undefined : optionalArea(body.dien_tich, "dien_tich"),
  });
  if (!room) return c.json({ error: "not_found" }, 404);

  return c.json({ room });
});

/** Fails with 409 if readings, invoices, tenants or an account still point here. */
roomRoutes.delete("/:id", async (c) => {
  await deleteRoom(c.env.DB, parseId(c.req.param("id")));
  return c.json({ ok: true });
});
