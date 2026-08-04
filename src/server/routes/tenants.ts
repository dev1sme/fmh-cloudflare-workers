import { Hono } from "hono";

import { createTenant, getTenant, listTenants, updateTenant } from "../db/tenants";
import { homNay } from "../domain/ky";
import type { AppEnv } from "../types";
import {
  jsonBody,
  optionalDate,
  optionalString,
  parseId,
  queryId,
  requireDate,
  requireId,
  requireString,
} from "../validate";

export const tenantRoutes = new Hono<AppEnv>();

tenantRoutes.get("/", async (c) => {
  const tenants = await listTenants(c.env.DB, {
    room_id: queryId(c.req.query("room_id"), "room_id"),
    dang_thue: c.req.query("dang_thue") === "1",
  });

  return c.json({ tenants });
});

/** Moves a tenant in. The DB rejects a second active tenant for the same room. */
tenantRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const tenant = await createTenant(c.env.DB, {
    room_id: requireId(body.room_id, "room_id"),
    ho_ten: requireString(body.ho_ten, "ho_ten", 100),
    sdt: optionalString(body.sdt, "sdt", 20),
    ngay_vao: body.ngay_vao === undefined ? homNay() : requireDate(body.ngay_vao, "ngay_vao"),
  });

  return c.json({ tenant }, 201);
});

/** Setting `ngay_ra` moves the tenant out and frees the room for the next one. */
tenantRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = await jsonBody(c.req);

  if (!(await getTenant(c.env.DB, id))) return c.json({ error: "not_found" }, 404);

  const tenant = await updateTenant(c.env.DB, id, {
    ho_ten: body.ho_ten === undefined ? undefined : requireString(body.ho_ten, "ho_ten", 100),
    sdt: body.sdt === undefined ? undefined : optionalString(body.sdt, "sdt", 20),
    ngay_vao: body.ngay_vao === undefined ? undefined : requireDate(body.ngay_vao, "ngay_vao"),
    ngay_ra: body.ngay_ra === undefined ? undefined : optionalDate(body.ngay_ra, "ngay_ra"),
  });

  return c.json({ tenant });
});
