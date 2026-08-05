import type { Reading, ReadingDetail } from "../../shared/types";
import { buildSet, Where } from "./sql";

const SELECT =
  "SELECT id, room_id, period, electricity_start, electricity_end, water_start, water_end, recorded_on FROM readings";

const DETAIL_SELECT = `
  SELECT rd.id, rd.room_id, rd.period, rd.electricity_start, rd.electricity_end, rd.water_start, rd.water_end, rd.recorded_on,
         r.room_name,
         rd.electricity_end - rd.electricity_start AS electricity_used,
         rd.water_end - rd.water_start AS water_used
  FROM readings rd
  JOIN rooms r ON r.id = rd.room_id
`;

export async function listReadings(
  db: D1Database,
  filters: { period?: string; room_id?: number } = {},
): Promise<ReadingDetail[]> {
  const where = new Where().add("rd.period = ?", filters.period).add("rd.room_id = ?", filters.room_id);

  const { results } = await db
    .prepare(`${DETAIL_SELECT}${where.clause()} ORDER BY rd.period DESC, r.room_name`)
    .bind(...where.bindings())
    .all<ReadingDetail>();
  return results;
}

export function getReading(db: D1Database, id: number): Promise<Reading | null> {
  return db.prepare(`${SELECT} WHERE id = ?`).bind(id).first<Reading>();
}

export function getReadingByRoomKy(
  db: D1Database,
  roomId: number,
  period: string,
): Promise<Reading | null> {
  return db.prepare(`${SELECT} WHERE room_id = ? AND period = ?`).bind(roomId, period).first<Reading>();
}

/**
 * Latest reading strictly before `period` — the source of the opening numbers when
 * a new period is recorded. String comparison works because `period` is `YYYY-MM`.
 */
export function getPreviousReading(
  db: D1Database,
  roomId: number,
  period: string,
): Promise<Reading | null> {
  return db
    .prepare(`${SELECT} WHERE room_id = ? AND period < ? ORDER BY period DESC LIMIT 1`)
    .bind(roomId, period)
    .first<Reading>();
}

export type ReadingInput = {
  room_id: number;
  period: string;
  electricity_start: number;
  electricity_end: number;
  water_start: number;
  water_end: number;
  recorded_on: string;
};

export async function createReading(
  db: D1Database,
  input: ReadingInput,
): Promise<Reading | null> {
  const row = await db
    .prepare(
      `INSERT INTO readings (room_id, period, electricity_start, electricity_end, water_start, water_end, recorded_on)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(
      input.room_id,
      input.period,
      input.electricity_start,
      input.electricity_end,
      input.water_start,
      input.water_end,
      input.recorded_on,
    )
    .first<{ id: number }>();

  return row ? getReading(db, row.id) : null;
}

export type ReadingPatch = {
  electricity_start?: number;
  electricity_end?: number;
  water_start?: number;
  water_end?: number;
  recorded_on?: string;
};

export async function updateReading(
  db: D1Database,
  id: number,
  patch: ReadingPatch,
): Promise<Reading | null> {
  const set = buildSet(patch);
  if (set) {
    await db
      .prepare(`UPDATE readings SET ${set.clause} WHERE id = ?`)
      .bind(...set.values, id)
      .run();
  }
  return getReading(db, id);
}

export async function deleteReading(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM readings WHERE id = ?").bind(id).run();
}
