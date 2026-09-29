import { Hono } from "hono";

import {
  createBuilding,
  deleteBuilding,
  getBuilding,
  listBuildings,
  updateBuilding,
} from "../db/buildings";
import { notFound, ok } from "../envelope";
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

buildingRoutes.get("/", async (c) =>
  ok(c, { buildings: await listBuildings(c.env.DB) }, "Buildings retrieved."),
);

buildingRoutes.get("/:id", async (c) => {
  const building = await getBuilding(c.env.DB, parseId(c.req.param("id")));
  if (!building) return notFound(c, "Building not found.");

  return ok(c, { building }, "Building retrieved.");
});

/** 6-digit NAPAS acquirer id; anything else would produce an unscannable QR. */
function bankBin(value: unknown): string | null {
  const bin = optionalString(value, "bank_bin", 6);
  if (bin !== null && !/^\d{6}$/.test(bin)) fail("INVALID_BANK_BIN");
  return bin;
}

function bankAccountNo(value: unknown): string | null {
  const accountNo = optionalString(value, "bank_account_no", 30);
  if (accountNo !== null && !/^\d+$/.test(accountNo)) fail("INVALID_BANK_ACCOUNT_NO");
  return accountNo;
}

function momoPhone(value: unknown): string | null {
  const phone = optionalString(value, "momo_phone", 15);
  if (phone !== null && !/^0\d{8,11}$/.test(phone)) fail("INVALID_MOMO_PHONE");
  return phone;
}

buildingRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const building = await createBuilding(c.env.DB, {
    name: requireString(body.name, "name", 100),
    address: optionalString(body.address, "address"),
    electricity_rate: requireInt(body.electricity_rate, "electricity_rate"),
    water_rate: requireInt(body.water_rate, "water_rate"),
    bank_bin: bankBin(body.bank_bin),
    bank_account_no: bankAccountNo(body.bank_account_no),
    bank_account_name: optionalString(body.bank_account_name, "bank_account_name", 100),
    momo_phone: momoPhone(body.momo_phone),
    momo_name: optionalString(body.momo_name, "momo_name", 100),
  });

  return ok(c, { building }, "Building created.", 201);
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
    electricity_rate: optionalInt(body.electricity_rate, "electricity_rate"),
    water_rate: optionalInt(body.water_rate, "water_rate"),
    bank_bin: body.bank_bin === undefined ? undefined : bankBin(body.bank_bin),
    bank_account_no: body.bank_account_no === undefined ? undefined : bankAccountNo(body.bank_account_no),
    bank_account_name:
      body.bank_account_name === undefined
        ? undefined
        : optionalString(body.bank_account_name, "bank_account_name", 100),
    momo_phone: body.momo_phone === undefined ? undefined : momoPhone(body.momo_phone),
    momo_name:
      body.momo_name === undefined ? undefined : optionalString(body.momo_name, "momo_name", 100),
  });
  if (!building) return notFound(c, "Building not found.");

  return ok(c, { building }, "Building updated.");
});

/** Fails with 409 while the building still has rooms. */
buildingRoutes.delete("/:id", async (c) => {
  await deleteBuilding(c.env.DB, parseId(c.req.param("id")));
  return ok(c, { ok: true }, "Building deleted.");
});
