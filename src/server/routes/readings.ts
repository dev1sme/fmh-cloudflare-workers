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
import { homNay } from "../domain/ky";
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
  requireKy,
  optionalKy,
} from "../validate";

export const readingRoutes = new Hono<AppEnv>();

readingRoutes.get("/", async (c) => {
  const readings = await listReadings(c.env.DB, {
    ky: optionalKy(c.req.query("ky")),
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
  const ky = optionalKy(c.req.query("ky"));
  if (roomId === undefined || ky === undefined) fail("missing_room_id_hoac_ky");

  const previous = await getPreviousReading(c.env.DB, roomId, ky);

  return ok(
    c,
    {
      ky,
      room_id: roomId,
      dien_cu: previous?.dien_moi ?? 0,
      nuoc_cu: previous?.nuoc_moi ?? 0,
      ky_truoc: previous?.ky ?? null,
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
 * `dien_cu` / `nuoc_cu` may be omitted — they are carried over from the previous
 * period's closing numbers, which is the normal case when recording a month.
 */
readingRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const roomId = requireId(body.room_id, "room_id");
  const ky = requireKy(body.ky);

  if (!(await getRoom(c.env.DB, roomId))) {
    return failure(c, "phong_khong_ton_tai", "Room not found.", 404);
  }
  if (await getReadingByRoomKy(c.env.DB, roomId, ky)) {
    return failure(c, "da_co_chi_so_ky_nay", "This room already has a reading for the period.", 409);
  }

  const previous = await getPreviousReading(c.env.DB, roomId, ky);
  const dien_cu = optionalInt(body.dien_cu, "dien_cu") ?? previous?.dien_moi ?? 0;
  const nuoc_cu = optionalInt(body.nuoc_cu, "nuoc_cu") ?? previous?.nuoc_moi ?? 0;
  const dien_moi = requireInt(body.dien_moi, "dien_moi");
  const nuoc_moi = requireInt(body.nuoc_moi, "nuoc_moi");

  if (dien_moi < dien_cu) fail("dien_moi_nho_hon_dien_cu");
  if (nuoc_moi < nuoc_cu) fail("nuoc_moi_nho_hon_nuoc_cu");

  const reading = await createReading(c.env.DB, {
    room_id: roomId,
    ky,
    dien_cu,
    dien_moi,
    nuoc_cu,
    nuoc_moi,
    ngay_ghi: optionalDate(body.ngay_ghi, "ngay_ghi") ?? homNay(),
  });

  return ok(c, { reading }, "Reading recorded.", 201);
});

readingRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = await jsonBody(c.req);

  const current = await getReading(c.env.DB, id);
  if (!current) return notFound(c, "Reading not found.");

  const next = {
    dien_cu: optionalInt(body.dien_cu, "dien_cu") ?? current.dien_cu,
    dien_moi: optionalInt(body.dien_moi, "dien_moi") ?? current.dien_moi,
    nuoc_cu: optionalInt(body.nuoc_cu, "nuoc_cu") ?? current.nuoc_cu,
    nuoc_moi: optionalInt(body.nuoc_moi, "nuoc_moi") ?? current.nuoc_moi,
  };

  if (next.dien_moi < next.dien_cu) fail("dien_moi_nho_hon_dien_cu");
  if (next.nuoc_moi < next.nuoc_cu) fail("nuoc_moi_nho_hon_nuoc_cu");

  const reading = await updateReading(c.env.DB, id, {
    ...next,
    ngay_ghi: body.ngay_ghi === undefined ? undefined : (optionalDate(body.ngay_ghi, "ngay_ghi") ?? undefined),
  });

  return ok(c, { reading }, "Reading updated.");
});

readingRoutes.delete("/:id", async (c) => {
  await deleteReading(c.env.DB, parseId(c.req.param("id")));
  return ok(c, { ok: true }, "Reading deleted.");
});
