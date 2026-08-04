import type { Reading, ReadingDetail } from "../../shared/types";
import { buildSet, Where } from "./sql";

const SELECT =
  "SELECT id, room_id, ky, dien_cu, dien_moi, nuoc_cu, nuoc_moi, ngay_ghi FROM readings";

const DETAIL_SELECT = `
  SELECT rd.id, rd.room_id, rd.ky, rd.dien_cu, rd.dien_moi, rd.nuoc_cu, rd.nuoc_moi, rd.ngay_ghi,
         r.ten_phong,
         rd.dien_moi - rd.dien_cu AS so_dien,
         rd.nuoc_moi - rd.nuoc_cu AS so_nuoc
  FROM readings rd
  JOIN rooms r ON r.id = rd.room_id
`;

export async function listReadings(
  db: D1Database,
  filters: { ky?: string; room_id?: number } = {},
): Promise<ReadingDetail[]> {
  const where = new Where().add("rd.ky = ?", filters.ky).add("rd.room_id = ?", filters.room_id);

  const { results } = await db
    .prepare(`${DETAIL_SELECT}${where.clause()} ORDER BY rd.ky DESC, r.ten_phong`)
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
  ky: string,
): Promise<Reading | null> {
  return db.prepare(`${SELECT} WHERE room_id = ? AND ky = ?`).bind(roomId, ky).first<Reading>();
}

/**
 * Latest reading strictly before `ky` — the source of the opening numbers when
 * a new period is recorded. String comparison works because `ky` is `YYYY-MM`.
 */
export function getPreviousReading(
  db: D1Database,
  roomId: number,
  ky: string,
): Promise<Reading | null> {
  return db
    .prepare(`${SELECT} WHERE room_id = ? AND ky < ? ORDER BY ky DESC LIMIT 1`)
    .bind(roomId, ky)
    .first<Reading>();
}

export type ReadingInput = {
  room_id: number;
  ky: string;
  dien_cu: number;
  dien_moi: number;
  nuoc_cu: number;
  nuoc_moi: number;
  ngay_ghi: string;
};

export async function createReading(
  db: D1Database,
  input: ReadingInput,
): Promise<Reading | null> {
  const row = await db
    .prepare(
      `INSERT INTO readings (room_id, ky, dien_cu, dien_moi, nuoc_cu, nuoc_moi, ngay_ghi)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(
      input.room_id,
      input.ky,
      input.dien_cu,
      input.dien_moi,
      input.nuoc_cu,
      input.nuoc_moi,
      input.ngay_ghi,
    )
    .first<{ id: number }>();

  return row ? getReading(db, row.id) : null;
}

export type ReadingPatch = {
  dien_cu?: number;
  dien_moi?: number;
  nuoc_cu?: number;
  nuoc_moi?: number;
  ngay_ghi?: string;
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
