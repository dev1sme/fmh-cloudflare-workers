import { Hono } from "hono";

import { createTenant, deleteTenant, getTenantByCode, listTenants, updateTenant } from "../db/tenants";
import { CODE_PREFIX, sinhMa } from "../domain/code";
import { homNay } from "../domain/period";
import { notFound, ok } from "../envelope";
import type { AppEnv } from "../types";
import {
  fail,
  jsonBody,
  optionalDate,
  optionalString,
  parseCode,
  queryId,
  requireDate,
  requireId,
  requireString,
} from "../validate";

/** Occupants living under one tenancy. The named tenant counts as one. */
function soNguoi(value: unknown, fallback?: number): number | undefined {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) fail("INVALID_OCCUPANTS");
  return value;
}

export const tenantRoutes = new Hono<AppEnv>();

tenantRoutes.get("/", async (c) => {
  const tenants = await listTenants(c.env.DB, {
    room_id: queryId(c.req.query("room_id"), "room_id"),
    active: c.req.query("active") === "1",
  });

  return ok(c, { tenants }, "Tenants retrieved.");
});

/** Moves a tenant in. The DB rejects a second active tenant for the same room. */
tenantRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const tenant = await createTenant(c.env.DB, {
    code: sinhMa(CODE_PREFIX.tenant),
    room_id: requireId(body.room_id, "room_id"),
    full_name: requireString(body.full_name, "full_name", 100),
    phone: optionalString(body.phone, "phone", 20),
    occupants: soNguoi(body.occupants, 1)!,
    moved_in: body.moved_in === undefined ? homNay() : requireDate(body.moved_in, "moved_in"),
  });

  return ok(c, { tenant }, "Tenant moved in.", 201);
});

/**
 * Setting `moved_out` moves the tenant out and frees the room; sending null puts
 * them back as the current tenant, which is how a mistaken move-out is undone.
 */
// Paths carry the public code; the row id stays internal and in foreign keys.
tenantRoutes.patch("/:code", async (c) => {
  const body = await jsonBody(c.req);

  const current = await getTenantByCode(c.env.DB, parseCode(CODE_PREFIX.tenant, c.req.param("code")));
  if (!current) return notFound(c, "Tenant not found.");

  const tenant = await updateTenant(c.env.DB, current.id, {
    full_name: body.full_name === undefined ? undefined : requireString(body.full_name, "full_name", 100),
    phone: body.phone === undefined ? undefined : optionalString(body.phone, "phone", 20),
    occupants: soNguoi(body.occupants),
    moved_in: body.moved_in === undefined ? undefined : requireDate(body.moved_in, "moved_in"),
    moved_out: body.moved_out === undefined ? undefined : optionalDate(body.moved_out, "moved_out"),
  });

  return ok(c, { tenant }, "Tenant updated.");
});

/** For records entered by mistake — moving out is a PATCH, not a delete. */
tenantRoutes.delete("/:code", async (c) => {
  const tenant = await getTenantByCode(c.env.DB, parseCode(CODE_PREFIX.tenant, c.req.param("code")));
  if (!tenant) return notFound(c, "Tenant not found.");

  await deleteTenant(c.env.DB, tenant.id);
  return ok(c, { ok: true }, "Tenant deleted.");
});
