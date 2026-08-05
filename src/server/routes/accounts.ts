import { Hono } from "hono";

import { hashPassword } from "../auth";
import {
  countManagers,
  createAccount,
  deleteAccount,
  getAccount,
  listAccounts,
  renameAccount,
  setPasswordHash,
} from "../db/users";
import { DO_DAI_TOI_THIEU, sinhMatKhau } from "../domain/password";
import { failure, notFound, ok } from "../envelope";
import type { AppEnv, Role } from "../types";
import { fail, jsonBody, parseId, requireEnum, requireId, requireString } from "../validate";

const ROLES: readonly Role[] = ["quan_ly", "nguoi_thue"];

/**
 * Account management for the manager.
 *
 * A plaintext password is returned exactly once — in the response to the
 * request that created it — so the manager can hand it to the tenant. It is
 * never stored in plaintext and no endpoint can read it back afterwards; a
 * forgotten password is replaced by resetting it, not by looking it up.
 */
export const accountRoutes = new Hono<AppEnv>();

/** Uses the supplied password, or generates a strong one when none is given. */
function chonMatKhau(value: unknown): string {
  if (value === undefined || value === null || value === "") return sinhMatKhau();
  if (typeof value !== "string") fail("invalid_password");
  if (value.length < DO_DAI_TOI_THIEU) fail("password_qua_ngan");
  return value;
}

accountRoutes.get("/", async (c) =>
  ok(c, { accounts: await listAccounts(c.env.DB) }, "Accounts retrieved."),
);

accountRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const vaiTro = requireEnum(body.vai_tro, "vai_tro", ROLES);
  const roomId = vaiTro === "quan_ly" ? null : requireId(body.room_id, "room_id");
  const password = chonMatKhau(body.password);

  const account = await createAccount(c.env.DB, {
    username: requireString(body.username, "username", 50),
    password_hash: await hashPassword(password),
    vai_tro: vaiTro,
    room_id: roomId,
  });

  // The only time the plaintext is ever returned — hand it to the tenant now,
  // because no endpoint can read it back afterwards.
  return ok(c, { account, password }, "Account created.", 201);
});

accountRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = await jsonBody(c.req);

  if (!(await getAccount(c.env.DB, id))) return notFound(c, "Account not found.");

  const account = await renameAccount(c.env.DB, id, requireString(body.username, "username", 50));
  return ok(c, { account }, "Account renamed.");
});

/**
 * Resets without asking for the current password — the manager is resetting
 * someone else's access, and would not know it.
 */
accountRoutes.post("/:id/reset-password", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = await jsonBody(c.req).catch(() => ({}) as Record<string, unknown>);

  const account = await getAccount(c.env.DB, id);
  if (!account) return notFound(c, "Account not found.");

  const password = chonMatKhau(body.password);
  await setPasswordHash(c.env.DB, id, await hashPassword(password));

  return ok(c, { account, password }, "Password reset.");
});

accountRoutes.delete("/:id", async (c) => {
  const id = parseId(c.req.param("id"));

  const account = await getAccount(c.env.DB, id);
  if (!account) return notFound(c, "Account not found.");

  // Two ways to lock everyone out of the app; both refused.
  if (id === c.get("user").id) {
    return failure(c, "khong_tu_xoa", "You cannot delete the account you are signed in as.", 409);
  }
  if (account.vai_tro === "quan_ly" && (await countManagers(c.env.DB)) <= 1) {
    return failure(c, "phai_con_mot_quan_ly", "At least one manager account must remain.", 409);
  }

  await deleteAccount(c.env.DB, id);
  return ok(c, { ok: true }, "Account deleted.");
});
