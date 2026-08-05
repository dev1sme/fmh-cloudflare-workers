import { Hono } from "hono";

import { createRoom, deleteRoom, getRoom, listRooms, updateRoom } from "../db/rooms";
import { notFound, ok } from "../envelope";
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

roomRoutes.get("/", async (c) => ok(c, { rooms: await listRooms(c.env.DB) }, "Rooms retrieved."));

roomRoutes.get("/:id", async (c) => {
  const room = await getRoom(c.env.DB, parseId(c.req.param("id")));
  if (!room) return notFound(c, "Room not found.");

  return ok(c, { room }, "Room retrieved.");
});

roomRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const room = await createRoom(c.env.DB, {
    building_id: requireId(body.building_id, "building_id"),
    room_name: requireString(body.room_name, "room_name", 50),
    rent: requireInt(body.rent, "rent"),
    area: optionalArea(body.area, "area"),
  });

  return ok(c, { room }, "Room created.", 201);
});

roomRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = await jsonBody(c.req);

  const room = await updateRoom(c.env.DB, id, {
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
roomRoutes.delete("/:id", async (c) => {
  await deleteRoom(c.env.DB, parseId(c.req.param("id")));
  return ok(c, { ok: true }, "Room deleted.");
});
