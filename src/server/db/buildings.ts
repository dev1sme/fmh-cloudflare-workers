import type { Building } from "../../shared/types";
import { buildSet } from "./sql";

const COLUMNS = `id, name, address, electricity_rate, water_rate,
                 bank_bin, bank_account_no, bank_account_name, momo_phone, momo_name`;

export async function listBuildings(db: D1Database): Promise<Building[]> {
  const { results } = await db
    .prepare(`SELECT ${COLUMNS} FROM buildings ORDER BY name`)
    .all<Building>();
  return results;
}

export function getBuilding(db: D1Database, id: number): Promise<Building | null> {
  return db.prepare(`SELECT ${COLUMNS} FROM buildings WHERE id = ?`).bind(id).first<Building>();
}

export type BuildingInput = {
  name: string;
  address: string | null;
  electricity_rate: number;
  water_rate: number;
  bank_bin?: string | null;
  bank_account_no?: string | null;
  bank_account_name?: string | null;
  momo_phone?: string | null;
  momo_name?: string | null;
};

export async function createBuilding(
  db: D1Database,
  input: BuildingInput,
): Promise<Building | null> {
  const row = await db
    .prepare(
      `INSERT INTO buildings (name, address, electricity_rate, water_rate,
                              bank_bin, bank_account_no, bank_account_name, momo_phone, momo_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(
      input.name,
      input.address,
      input.electricity_rate,
      input.water_rate,
      input.bank_bin ?? null,
      input.bank_account_no ?? null,
      input.bank_account_name ?? null,
      input.momo_phone ?? null,
      input.momo_name ?? null,
    )
    .first<{ id: number }>();

  return row ? getBuilding(db, row.id) : null;
}

/** Fails with a foreign key error while any room still points at the building. */
export async function deleteBuilding(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM buildings WHERE id = ?").bind(id).run();
}

export type BuildingPatch = {
  name?: string;
  address?: string | null;
  electricity_rate?: number;
  water_rate?: number;
  bank_bin?: string | null;
  bank_account_no?: string | null;
  bank_account_name?: string | null;
  momo_phone?: string | null;
  momo_name?: string | null;
};

export async function updateBuilding(
  db: D1Database,
  id: number,
  patch: BuildingPatch,
): Promise<Building | null> {
  const set = buildSet(patch);
  if (set) {
    await db
      .prepare(`UPDATE buildings SET ${set.clause} WHERE id = ?`)
      .bind(...set.values, id)
      .run();
  }
  return getBuilding(db, id);
}
