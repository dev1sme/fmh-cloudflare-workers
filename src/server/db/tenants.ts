import type { Tenant, TenantDetail } from "../../shared/types";
import { buildSet, Where } from "./sql";

const SELECT = "SELECT id, code, room_id, full_name, phone, occupants, moved_in, moved_out FROM tenants";

const DETAIL_SELECT = `
  SELECT t.id, t.code, t.room_id, t.full_name, t.phone, t.occupants, t.moved_in, t.moved_out, r.room_name
  FROM tenants t
  JOIN rooms r ON r.id = t.room_id
`;

/** Everyone who has ever rented, unless filtered down. */
export async function listTenants(
  db: D1Database,
  filters: { room_id?: number; active?: boolean } = {},
): Promise<TenantDetail[]> {
  const where = new Where()
    .add("t.room_id = ?", filters.room_id)
    .addRaw("t.moved_out IS NULL", filters.active === true);

  const { results } = await db
    .prepare(
      `${DETAIL_SELECT}${where.clause()}
       ORDER BY r.room_name, t.moved_out IS NOT NULL, t.moved_in DESC, t.id DESC`,
    )
    .bind(...where.bindings())
    .all<TenantDetail>();
  return results;
}

function getTenant(db: D1Database, id: number): Promise<Tenant | null> {
  return db.prepare(`${SELECT} WHERE id = ?`).bind(id).first<Tenant>();
}

/** Paths carry the public code; ids stay internal and in foreign keys. */
export function getTenantByCode(db: D1Database, code: string): Promise<Tenant | null> {
  return db.prepare(`${SELECT} WHERE code = ?`).bind(code).first<Tenant>();
}

export type TenantInput = {
  code: string;
  room_id: number;
  full_name: string;
  phone: string | null;
  occupants: number;
  moved_in: string;
};

export async function createTenant(db: D1Database, input: TenantInput): Promise<Tenant | null> {
  const row = await db
    .prepare(
      `INSERT INTO tenants (code, room_id, full_name, phone, occupants, moved_in)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(input.code, input.room_id, input.full_name, input.phone, input.occupants, input.moved_in)
    .first<{ id: number }>();

  return row ? getTenant(db, row.id) : null;
}

export type TenantPatch = {
  full_name?: string;
  phone?: string | null;
  occupants?: number;
  moved_in?: string;
  /** A date marks the tenant as moved out; null puts them back as current. */
  moved_out?: string | null;
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
