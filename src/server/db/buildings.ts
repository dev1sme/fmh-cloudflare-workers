import type { Building } from "../../shared/types";
import { buildSet } from "./sql";

const COLUMNS = `id, name, address, don_gia_dien, don_gia_nuoc,
                 bank_bin, bank_so_tk, bank_chu_tk`;

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
  don_gia_dien: number;
  don_gia_nuoc: number;
  bank_bin?: string | null;
  bank_so_tk?: string | null;
  bank_chu_tk?: string | null;
};

export async function createBuilding(
  db: D1Database,
  input: BuildingInput,
): Promise<Building | null> {
  const row = await db
    .prepare(
      `INSERT INTO buildings (name, address, don_gia_dien, don_gia_nuoc,
                              bank_bin, bank_so_tk, bank_chu_tk)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(
      input.name,
      input.address,
      input.don_gia_dien,
      input.don_gia_nuoc,
      input.bank_bin ?? null,
      input.bank_so_tk ?? null,
      input.bank_chu_tk ?? null,
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
  don_gia_dien?: number;
  don_gia_nuoc?: number;
  bank_bin?: string | null;
  bank_so_tk?: string | null;
  bank_chu_tk?: string | null;
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
