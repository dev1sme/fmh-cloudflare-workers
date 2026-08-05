import { Hono } from "hono";

import { createTenant, deleteTenant, getTenant, listTenants, updateTenant } from "../db/tenants";
import { homNay } from "../domain/ky";
import { notFound, ok } from "../envelope";
import type { AppEnv } from "../types";
import {
  fail,
  jsonBody,
  optionalDate,
  optionalString,
  parseId,
  queryId,
  requireDate,
  requireId,
  requireString,
} from "../validate";

/** Occupants living under one tenancy. The named tenant counts as one. */
function soNguoi(value: unknown, fallback?: number): number | undefined {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) fail("invalid_so_nguoi");
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
    room_id: requireId(body.room_id, "room_id"),
    ho_ten: requireString(body.ho_ten, "ho_ten", 100),
    sdt: optionalString(body.sdt, "sdt", 20),
    so_nguoi: soNguoi(body.so_nguoi, 1)!,
    ngay_vao: body.ngay_vao === undefined ? homNay() : requireDate(body.ngay_vao, "ngay_vao"),
  });

  return ok(c, { tenant }, "Tenant moved in.", 201);
});

/**
 * Setting `ngay_ra` moves the tenant out and frees the room; sending null puts
 * them back as the current tenant, which is how a mistaken move-out is undone.
 */
tenantRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = await jsonBody(c.req);

  if (!(await getTenant(c.env.DB, id))) return notFound(c, "Tenant not found.");

  const tenant = await updateTenant(c.env.DB, id, {
    ho_ten: body.ho_ten === undefined ? undefined : requireString(body.ho_ten, "ho_ten", 100),
    sdt: body.sdt === undefined ? undefined : optionalString(body.sdt, "sdt", 20),
    so_nguoi: soNguoi(body.so_nguoi),
    ngay_vao: body.ngay_vao === undefined ? undefined : requireDate(body.ngay_vao, "ngay_vao"),
    ngay_ra: body.ngay_ra === undefined ? undefined : optionalDate(body.ngay_ra, "ngay_ra"),
  });

  return ok(c, { tenant }, "Tenant updated.");
});

/** For records entered by mistake — moving out is a PATCH, not a delete. */
tenantRoutes.delete("/:id", async (c) => {
  await deleteTenant(c.env.DB, parseId(c.req.param("id")));
  return ok(c, { ok: true }, "Tenant deleted.");
});
