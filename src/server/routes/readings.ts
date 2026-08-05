import { Hono } from "hono";

import { getRoom } from "../db/rooms";
import {
  createReading,
  deleteReading,
  getPreviousReading,
  getReading,
  getReadingByRoomKy,
  listReadings,
  updateReading,
} from "../db/readings";
import { homNay } from "../domain/period";
import { failure, notFound, ok } from "../envelope";
import type { AppEnv } from "../types";
import {
  fail,
  jsonBody,
  optionalDate,
  optionalInt,
  parseId,
  queryId,
  requireId,
  requireInt,
  requirePeriod,
  optionalPeriod,
} from "../validate";

export const readingRoutes = new Hono<AppEnv>();

readingRoutes.get("/", async (c) => {
  const readings = await listReadings(c.env.DB, {
    period: optionalPeriod(c.req.query("period")),
    room_id: queryId(c.req.query("room_id"), "room_id"),
  });

  return ok(c, { readings }, "Readings retrieved.");
});

/**
 * Opening numbers for a new period, so the form can be pre-filled: the closing
 * numbers of the most recent earlier period, or zeros for a brand new room.
 */
readingRoutes.get("/suggest", async (c) => {
  const roomId = queryId(c.req.query("room_id"), "room_id");
  const period = optionalPeriod(c.req.query("period"));
  if (roomId === undefined || period === undefined) fail("MISSING_ROOM_ID_OR_PERIOD");

  const previous = await getPreviousReading(c.env.DB, roomId, period);

  return ok(
    c,
    {
      period,
      room_id: roomId,
      electricity_start: previous?.electricity_end ?? 0,
      water_start: previous?.water_end ?? 0,
      previous_period: previous?.period ?? null,
    },
    "Opening numbers suggested.",
  );
});

readingRoutes.get("/:id", async (c) => {
  const reading = await getReading(c.env.DB, parseId(c.req.param("id")));
  if (!reading) return notFound(c, "Reading not found.");

  return ok(c, { reading }, "Reading retrieved.");
});

/**
 * `electricity_start` / `water_start` may be omitted — they are carried over from the previous
 * period's closing numbers, which is the normal case when recording a month.
 */
readingRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const roomId = requireId(body.room_id, "room_id");
  const period = requirePeriod(body.period);

  if (!(await getRoom(c.env.DB, roomId))) {
    return failure(c, "ROOM_NOT_FOUND", "Room not found.", 404);
  }
  if (await getReadingByRoomKy(c.env.DB, roomId, period)) {
    return failure(c, "READING_ALREADY_EXISTS", "This room already has a reading for the period.", 409);
  }

  const previous = await getPreviousReading(c.env.DB, roomId, period);
  const electricity_start = optionalInt(body.electricity_start, "electricity_start") ?? previous?.electricity_end ?? 0;
  const water_start = optionalInt(body.water_start, "water_start") ?? previous?.water_end ?? 0;
  const electricity_end = requireInt(body.electricity_end, "electricity_end");
  const water_end = requireInt(body.water_end, "water_end");

  if (electricity_end < electricity_start) fail("ELECTRICITY_END_BELOW_START");
  if (water_end < water_start) fail("WATER_END_BELOW_START");

  const reading = await createReading(c.env.DB, {
    room_id: roomId,
    period,
    electricity_start,
    electricity_end,
    water_start,
    water_end,
    recorded_on: optionalDate(body.recorded_on, "recorded_on") ?? homNay(),
  });

  return ok(c, { reading }, "Reading recorded.", 201);
});

readingRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = await jsonBody(c.req);

  const current = await getReading(c.env.DB, id);
  if (!current) return notFound(c, "Reading not found.");

  const next = {
    electricity_start: optionalInt(body.electricity_start, "electricity_start") ?? current.electricity_start,
    electricity_end: optionalInt(body.electricity_end, "electricity_end") ?? current.electricity_end,
    water_start: optionalInt(body.water_start, "water_start") ?? current.water_start,
    water_end: optionalInt(body.water_end, "water_end") ?? current.water_end,
  };

  if (next.electricity_end < next.electricity_start) fail("ELECTRICITY_END_BELOW_START");
  if (next.water_end < next.water_start) fail("WATER_END_BELOW_START");

  const reading = await updateReading(c.env.DB, id, {
    ...next,
    recorded_on: body.recorded_on === undefined ? undefined : (optionalDate(body.recorded_on, "recorded_on") ?? undefined),
  });

  return ok(c, { reading }, "Reading updated.");
});

readingRoutes.delete("/:id", async (c) => {
  await deleteReading(c.env.DB, parseId(c.req.param("id")));
  return ok(c, { ok: true }, "Reading deleted.");
});
