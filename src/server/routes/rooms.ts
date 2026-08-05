import { Hono } from "hono";

import { createRoom, deleteRoom, getRoomByCode, listRooms, updateRoom } from "../db/rooms";
import { CODE_PREFIX, sinhMa } from "../domain/code";
import { notFound, ok } from "../envelope";
import type { AppEnv } from "../types";
import {
  jsonBody,
  optionalArea,
  optionalInt,
  parseCode,
  requireId,
  requireInt,
  requireString,
} from "../validate";

export const roomRoutes = new Hono<AppEnv>();

roomRoutes.get("/", async (c) => ok(c, { rooms: await listRooms(c.env.DB) }, "Rooms retrieved."));

// Paths carry the public code; the row id stays internal and in foreign keys.
roomRoutes.get("/:code", async (c) => {
  const room = await getRoomByCode(c.env.DB, parseCode(CODE_PREFIX.room, c.req.param("code")));
  if (!room) return notFound(c, "Room not found.");

  return ok(c, { room }, "Room retrieved.");
});

roomRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const room = await createRoom(c.env.DB, {
    code: sinhMa(CODE_PREFIX.room),
    building_id: requireId(body.building_id, "building_id"),
    room_name: requireString(body.room_name, "room_name", 50),
    rent: requireInt(body.rent, "rent"),
    area: optionalArea(body.area, "area"),
  });

  return ok(c, { room }, "Room created.", 201);
});

roomRoutes.patch("/:code", async (c) => {
  const body = await jsonBody(c.req);

  const current = await getRoomByCode(c.env.DB, parseCode(CODE_PREFIX.room, c.req.param("code")));
  if (!current) return notFound(c, "Room not found.");

  const room = await updateRoom(c.env.DB, current.id, {
    building_id: body.building_id === undefined ? undefined : requireId(body.building_id, "building_id"),
    room_name:
      body.room_name === undefined ? undefined : requireString(body.room_name, "room_name", 50),
    rent: optionalInt(body.rent, "rent"),
    area: body.area === undefined ? undefined : optionalArea(body.area, "area"),
  });
  if (!room) return notFound(c, "Room not found.");

  return ok(c, { room }, "Room updated.");
});

/** Fails with 409 if readings, invoices, tenants or an account still point here. */
roomRoutes.delete("/:code", async (c) => {
  const room = await getRoomByCode(c.env.DB, parseCode(CODE_PREFIX.room, c.req.param("code")));
  if (!room) return notFound(c, "Room not found.");

  await deleteRoom(c.env.DB, room.id);
  return ok(c, { ok: true }, "Room deleted.");
});
