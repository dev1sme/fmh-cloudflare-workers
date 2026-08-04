import type { Room, RoomDetail } from "../../shared/types";
import { buildSet } from "./sql";

type RoomDetailRow = Room & {
  building_name: string;
  don_gia_dien: number;
  don_gia_nuoc: number;
  tenant_id: number | null;
  tenant_ho_ten: string | null;
  tenant_sdt: string | null;
  tenant_so_nguoi: number | null;
  tenant_ngay_vao: string | null;
};

const DETAIL_SELECT = `
  SELECT r.id, r.building_id, r.ten_phong, r.gia_phong, r.dien_tich,
         b.name AS building_name, b.don_gia_dien, b.don_gia_nuoc,
         t.id AS tenant_id, t.ho_ten AS tenant_ho_ten, t.sdt AS tenant_sdt,
         t.so_nguoi AS tenant_so_nguoi, t.ngay_vao AS tenant_ngay_vao
  FROM rooms r
  JOIN buildings b ON b.id = r.building_id
  LEFT JOIN tenants t ON t.room_id = r.id AND t.ngay_ra IS NULL
`;

function toDetail(row: RoomDetailRow): RoomDetail {
  const {
    tenant_id,
    tenant_ho_ten,
    tenant_sdt,
    tenant_so_nguoi,
    tenant_ngay_vao,
    ...room
  } = row;

  return {
    ...room,
    tenant:
      tenant_id === null
        ? null
        : {
            id: tenant_id,
            room_id: row.id,
            ho_ten: tenant_ho_ten ?? "",
            sdt: tenant_sdt,
            so_nguoi: tenant_so_nguoi ?? 1,
            ngay_vao: tenant_ngay_vao ?? "",
            ngay_ra: null,
          },
  };
}

export async function listRooms(db: D1Database): Promise<RoomDetail[]> {
  const { results } = await db
    .prepare(`${DETAIL_SELECT} ORDER BY b.name, r.ten_phong`)
    .all<RoomDetailRow>();
  return results.map(toDetail);
}

export async function getRoom(db: D1Database, id: number): Promise<RoomDetail | null> {
  const row = await db.prepare(`${DETAIL_SELECT} WHERE r.id = ?`).bind(id).first<RoomDetailRow>();
  return row ? toDetail(row) : null;
}

export type RoomInput = {
  building_id: number;
  ten_phong: string;
  gia_phong: number;
  dien_tich: number | null;
};

export async function createRoom(db: D1Database, input: RoomInput): Promise<RoomDetail | null> {
  const row = await db
    .prepare(
      `INSERT INTO rooms (building_id, ten_phong, gia_phong, dien_tich)
       VALUES (?, ?, ?, ?) RETURNING id`,
    )
    .bind(input.building_id, input.ten_phong, input.gia_phong, input.dien_tich)
    .first<{ id: number }>();

  return row ? getRoom(db, row.id) : null;
}

export type RoomPatch = {
  building_id?: number;
  ten_phong?: string;
  gia_phong?: number;
  dien_tich?: number | null;
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

export async function countRooms(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM rooms").first<{ n: number }>();
  return row?.n ?? 0;
}
