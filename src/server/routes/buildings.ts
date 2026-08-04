import { Hono } from "hono";

import {
  createBuilding,
  deleteBuilding,
  getBuilding,
  listBuildings,
  updateBuilding,
} from "../db/buildings";
import type { AppEnv } from "../types";
import {
  fail,
  jsonBody,
  optionalInt,
  optionalString,
  parseId,
  requireInt,
  requireString,
} from "../validate";

export const buildingRoutes = new Hono<AppEnv>();

buildingRoutes.get("/", async (c) => c.json({ buildings: await listBuildings(c.env.DB) }));

buildingRoutes.get("/:id", async (c) => {
  const building = await getBuilding(c.env.DB, parseId(c.req.param("id")));
  if (!building) return c.json({ error: "not_found" }, 404);

  return c.json({ building });
});

/** 6-digit NAPAS acquirer id; anything else would produce an unscannable QR. */
function bankBin(value: unknown): string | null {
  const bin = optionalString(value, "bank_bin", 6);
  if (bin !== null && !/^\d{6}$/.test(bin)) fail("invalid_bank_bin");
  return bin;
}

function bankSoTk(value: unknown): string | null {
  const so = optionalString(value, "bank_so_tk", 30);
  if (so !== null && !/^\d+$/.test(so)) fail("invalid_bank_so_tk");
  return so;
}

function momoSdt(value: unknown): string | null {
  const sdt = optionalString(value, "momo_sdt", 15);
  if (sdt !== null && !/^0\d{8,11}$/.test(sdt)) fail("invalid_momo_sdt");
  return sdt;
}

buildingRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const building = await createBuilding(c.env.DB, {
    name: requireString(body.name, "name", 100),
    address: optionalString(body.address, "address"),
    don_gia_dien: requireInt(body.don_gia_dien, "don_gia_dien"),
    don_gia_nuoc: requireInt(body.don_gia_nuoc, "don_gia_nuoc"),
    bank_bin: bankBin(body.bank_bin),
    bank_so_tk: bankSoTk(body.bank_so_tk),
    bank_chu_tk: optionalString(body.bank_chu_tk, "bank_chu_tk", 100),
    momo_sdt: momoSdt(body.momo_sdt),
    momo_ten: optionalString(body.momo_ten, "momo_ten", 100),
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
    bank_bin: body.bank_bin === undefined ? undefined : bankBin(body.bank_bin),
    bank_so_tk: body.bank_so_tk === undefined ? undefined : bankSoTk(body.bank_so_tk),
    bank_chu_tk:
      body.bank_chu_tk === undefined
        ? undefined
        : optionalString(body.bank_chu_tk, "bank_chu_tk", 100),
    momo_sdt: body.momo_sdt === undefined ? undefined : momoSdt(body.momo_sdt),
    momo_ten:
      body.momo_ten === undefined ? undefined : optionalString(body.momo_ten, "momo_ten", 100),
  });
  if (!building) return c.json({ error: "not_found" }, 404);

  return c.json({ building });
});

/** Fails with 409 while the building still has rooms. */
buildingRoutes.delete("/:id", async (c) => {
  await deleteBuilding(c.env.DB, parseId(c.req.param("id")));
  return c.json({ ok: true });
});
