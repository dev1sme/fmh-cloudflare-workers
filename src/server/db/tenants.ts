import type { Tenant, TenantDetail } from "../../shared/types";
import { buildSet, Where } from "./sql";

const SELECT = "SELECT id, room_id, ho_ten, sdt, so_nguoi, ngay_vao, ngay_ra FROM tenants";

const DETAIL_SELECT = `
  SELECT t.id, t.room_id, t.ho_ten, t.sdt, t.so_nguoi, t.ngay_vao, t.ngay_ra, r.ten_phong
  FROM tenants t
  JOIN rooms r ON r.id = t.room_id
`;

/** Everyone who has ever rented, unless filtered down. */
export async function listTenants(
  db: D1Database,
  filters: { room_id?: number; dang_thue?: boolean } = {},
): Promise<TenantDetail[]> {
  const where = new Where()
    .add("t.room_id = ?", filters.room_id)
    .addRaw("t.ngay_ra IS NULL", filters.dang_thue === true);

  const { results } = await db
    .prepare(
      `${DETAIL_SELECT}${where.clause()}
       ORDER BY r.ten_phong, t.ngay_ra IS NOT NULL, t.ngay_vao DESC, t.id DESC`,
    )
    .bind(...where.bindings())
    .all<TenantDetail>();
  return results;
}

export function getTenant(db: D1Database, id: number): Promise<Tenant | null> {
  return db.prepare(`${SELECT} WHERE id = ?`).bind(id).first<Tenant>();
}

export type TenantInput = {
  room_id: number;
  ho_ten: string;
  sdt: string | null;
  so_nguoi: number;
  ngay_vao: string;
};

export async function createTenant(db: D1Database, input: TenantInput): Promise<Tenant | null> {
  const row = await db
    .prepare(
      `INSERT INTO tenants (room_id, ho_ten, sdt, so_nguoi, ngay_vao)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(input.room_id, input.ho_ten, input.sdt, input.so_nguoi, input.ngay_vao)
    .first<{ id: number }>();

  return row ? getTenant(db, row.id) : null;
}

export type TenantPatch = {
  ho_ten?: string;
  sdt?: string | null;
  so_nguoi?: number;
  ngay_vao?: string;
  /** A date marks the tenant as moved out; null puts them back as current. */
  ngay_ra?: string | null;
};

export async function updateTenant(
  db: D1Database,
  id: number,
  patch: TenantPatch,
): Promise<Tenant | null> {
  const set = buildSet(patch);
  if (set) {
    await db
      .prepare(`UPDATE tenants SET ${set.clause} WHERE id = ?`)
      .bind(...set.values, id)
      .run();
  }
  return getTenant(db, id);
}

export async function deleteTenant(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM tenants WHERE id = ?").bind(id).run();
}
