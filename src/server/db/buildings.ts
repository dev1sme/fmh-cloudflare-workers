import type { Building } from "../../shared/types";
import { buildSet } from "./sql";

export async function listBuildings(db: D1Database): Promise<Building[]> {
  const { results } = await db
    .prepare("SELECT id, name, address, don_gia_dien, don_gia_nuoc FROM buildings ORDER BY name")
    .all<Building>();
  return results;
}

export function getBuilding(db: D1Database, id: number): Promise<Building | null> {
  return db
    .prepare("SELECT id, name, address, don_gia_dien, don_gia_nuoc FROM buildings WHERE id = ?")
    .bind(id)
    .first<Building>();
}

export type BuildingPatch = {
  name?: string;
  address?: string | null;
  don_gia_dien?: number;
  don_gia_nuoc?: number;
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
