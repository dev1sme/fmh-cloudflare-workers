import { Hono } from "hono";

import {
  createBuilding,
  deleteBuilding,
  getBuilding,
  listBuildings,
  updateBuilding,
} from "../db/buildings";
import type { AppEnv } from "../types";
import { jsonBody, optionalInt, optionalString, parseId, requireInt, requireString } from "../validate";

export const buildingRoutes = new Hono<AppEnv>();

buildingRoutes.get("/", async (c) => c.json({ buildings: await listBuildings(c.env.DB) }));

buildingRoutes.get("/:id", async (c) => {
  const building = await getBuilding(c.env.DB, parseId(c.req.param("id")));
  if (!building) return c.json({ error: "not_found" }, 404);

  return c.json({ building });
});

buildingRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const building = await createBuilding(c.env.DB, {
    name: requireString(body.name, "name", 100),
    address: optionalString(body.address, "address"),
    don_gia_dien: requireInt(body.don_gia_dien, "don_gia_dien"),
    don_gia_nuoc: requireInt(body.don_gia_nuoc, "don_gia_nuoc"),
  });

  return c.json({ building }, 201);
});

/**
 * Changing don_gia_* here only affects invoices generated from now on.
 * Invoices already issued keep the price they were created with.
 */
buildingRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = await jsonBody(c.req);

  const building = await updateBuilding(c.env.DB, id, {
    name: body.name === undefined ? undefined : requireString(body.name, "name", 100),
    address: body.address === undefined ? undefined : optionalString(body.address, "address"),
    don_gia_dien: optionalInt(body.don_gia_dien, "don_gia_dien"),
    don_gia_nuoc: optionalInt(body.don_gia_nuoc, "don_gia_nuoc"),
  });
  if (!building) return c.json({ error: "not_found" }, 404);

  return c.json({ building });
});

/** Fails with 409 while the building still has rooms. */
buildingRoutes.delete("/:id", async (c) => {
  await deleteBuilding(c.env.DB, parseId(c.req.param("id")));
  return c.json({ ok: true });
});
