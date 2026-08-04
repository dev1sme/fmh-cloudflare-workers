import type { Tenant } from "../../shared/types";
import { buildSet, Where } from "./sql";

const SELECT = "SELECT id, room_id, ho_ten, sdt, ngay_vao, ngay_ra FROM tenants";

export async function listTenants(
  db: D1Database,
  filters: { room_id?: number; dang_thue?: boolean } = {},
): Promise<Tenant[]> {
  const where = new Where()
    .add("room_id = ?", filters.room_id)
    .addRaw("ngay_ra IS NULL", filters.dang_thue === true);

  const { results } = await db
    .prepare(`${SELECT}${where.clause()} ORDER BY ngay_vao DESC, id DESC`)
    .bind(...where.bindings())
    .all<Tenant>();
  return results;
}

export function getTenant(db: D1Database, id: number): Promise<Tenant | null> {
  return db.prepare(`${SELECT} WHERE id = ?`).bind(id).first<Tenant>();
}

export type TenantInput = {
  room_id: number;
  ho_ten: string;
  sdt: string | null;
  ngay_vao: string;
};

export async function createTenant(db: D1Database, input: TenantInput): Promise<Tenant | null> {
  const row = await db
    .prepare(
      "INSERT INTO tenants (room_id, ho_ten, sdt, ngay_vao) VALUES (?, ?, ?, ?) RETURNING id",
    )
    .bind(input.room_id, input.ho_ten, input.sdt, input.ngay_vao)
    .first<{ id: number }>();

  return row ? getTenant(db, row.id) : null;
}

export type TenantPatch = {
  ho_ten?: string;
  sdt?: string | null;
  ngay_vao?: string;
  /** Setting this marks the tenant as moved out and frees the room. */
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
