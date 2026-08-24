import type { Room, RoomDetail } from "../../shared/types";
import { buildSet } from "./sql";

type RoomDetailRow = Room & {
  building_name: string;
  electricity_rate: number;
  water_rate: number;
  tenant_id: number | null;
  tenant_code: string | null;
  tenant_full_name: string | null;
  tenant_phone: string | null;
  tenant_occupants: number | null;
  tenant_moved_in: string | null;
};

const DETAIL_SELECT = `
  SELECT r.id, r.code, r.building_id, r.room_name, r.rent, r.area,
         b.name AS building_name, b.electricity_rate, b.water_rate,
         t.id AS tenant_id, t.code AS tenant_code, t.full_name AS tenant_full_name, t.phone AS tenant_phone,
         t.occupants AS tenant_occupants, t.moved_in AS tenant_moved_in
  FROM rooms r
  JOIN buildings b ON b.id = r.building_id
  LEFT JOIN tenants t ON t.room_id = r.id AND t.moved_out IS NULL
`;

function toDetail(row: RoomDetailRow): RoomDetail {
  const {
    tenant_id,
    tenant_code,
    tenant_full_name,
    tenant_phone,
    tenant_occupants,
    tenant_moved_in,
    ...room
  } = row;

  return {
    ...room,
    tenant:
      tenant_id === null
        ? null
        : {
            id: tenant_id,
            code: tenant_code ?? "",
            room_id: row.id,
            full_name: tenant_full_name ?? "",
            phone: tenant_phone,
            occupants: tenant_occupants ?? 1,
            moved_in: tenant_moved_in ?? "",
            moved_out: null,
          },
  };
}

export async function listRooms(db: D1Database): Promise<RoomDetail[]> {
  const { results } = await db
    .prepare(`${DETAIL_SELECT} ORDER BY b.name, r.room_name`)
    .all<RoomDetailRow>();
  return results.map(toDetail);
}

export async function getRoom(db: D1Database, id: number): Promise<RoomDetail | null> {
  const row = await db.prepare(`${DETAIL_SELECT} WHERE r.id = ?`).bind(id).first<RoomDetailRow>();
  return row ? toDetail(row) : null;
}

/** Paths carry the public code; ids stay internal and in foreign keys. */
export async function getRoomByCode(db: D1Database, code: string): Promise<RoomDetail | null> {
  const row = await db
    .prepare(`${DETAIL_SELECT} WHERE r.code = ?`)
    .bind(code)
    .first<RoomDetailRow>();
  return row ? toDetail(row) : null;
}

export type RoomInput = {
  code: string;
  building_id: number;
  room_name: string;
  rent: number;
  area: number | null;
};

export async function createRoom(db: D1Database, input: RoomInput): Promise<RoomDetail | null> {
  const row = await db
    .prepare(
      `INSERT INTO rooms (code, building_id, room_name, rent, area)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(input.code, input.building_id, input.room_name, input.rent, input.area)
    .first<{ id: number }>();

  return row ? getRoom(db, row.id) : null;
}

export type RoomPatch = {
  building_id?: number;
  room_name?: string;
  rent?: number;
  area?: number | null;
};

export async function updateRoom(
  db: D1Database,
  id: number,
  patch: RoomPatch,
): Promise<RoomDetail | null> {
  const set = buildSet(patch);
  if (set) {
    await db
      .prepare(`UPDATE rooms SET ${set.clause} WHERE id = ?`)
      .bind(...set.values, id)
      .run();
  }
  return getRoom(db, id);
}

export async function deleteRoom(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM rooms WHERE id = ?").bind(id).run();
}
