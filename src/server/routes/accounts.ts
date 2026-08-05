import { Hono } from "hono";

import { hashPassword } from "../auth";
import {
  countManagers,
  createAccount,
  deleteAccount,
  getAccountByCode,
  listAccounts,
  renameAccount,
  setPasswordHash,
} from "../db/users";
import { CODE_PREFIX, sinhMa } from "../domain/code";
import { DO_DAI_TOI_THIEU, sinhMatKhau } from "../domain/password";
import { failure, notFound, ok } from "../envelope";
import type { AppEnv, Role } from "../types";
import { fail, jsonBody, parseCode, requireEnum, requireId, requireString } from "../validate";

const ROLES: readonly Role[] = ["MANAGER", "TENANT"];

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
  if (typeof value !== "string") fail("INVALID_PASSWORD");
  if (value.length < DO_DAI_TOI_THIEU) fail("PASSWORD_TOO_SHORT");
  return value;
}

accountRoutes.get("/", async (c) =>
  ok(c, { accounts: await listAccounts(c.env.DB) }, "Accounts retrieved."),
);

accountRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);

  const vaiTro = requireEnum(body.role, "role", ROLES);
  const roomId = vaiTro === "MANAGER" ? null : requireId(body.room_id, "room_id");
  const password = chonMatKhau(body.password);

  const account = await createAccount(c.env.DB, {
    code: sinhMa(CODE_PREFIX.account),
    username: requireString(body.username, "username", 50),
    password_hash: await hashPassword(password),
    role: vaiTro,
    room_id: roomId,
  });

  // The only time the plaintext is ever returned — hand it to the tenant now,
  // because no endpoint can read it back afterwards.
  return ok(c, { account, password }, "Account created.", 201);
});

// Paths carry the public code; the row id stays internal and in foreign keys.
accountRoutes.patch("/:code", async (c) => {
  const body = await jsonBody(c.req);

  const current = await getAccountByCode(c.env.DB, parseCode(CODE_PREFIX.account, c.req.param("code")));
  if (!current) return notFound(c, "Account not found.");

  const account = await renameAccount(
    c.env.DB,
    current.id,
    requireString(body.username, "username", 50),
  );
  return ok(c, { account }, "Account renamed.");
});

/**
 * Resets without asking for the current password — the manager is resetting
 * someone else's access, and would not know it.
 */
accountRoutes.post("/:code/reset-password", async (c) => {
  const body = await jsonBody(c.req).catch(() => ({}) as Record<string, unknown>);

  const account = await getAccountByCode(c.env.DB, parseCode(CODE_PREFIX.account, c.req.param("code")));
  if (!account) return notFound(c, "Account not found.");

  const password = chonMatKhau(body.password);
  await setPasswordHash(c.env.DB, account.id, await hashPassword(password));

  return ok(c, { account, password }, "Password reset.");
});

accountRoutes.delete("/:code", async (c) => {
  const account = await getAccountByCode(c.env.DB, parseCode(CODE_PREFIX.account, c.req.param("code")));
  if (!account) return notFound(c, "Account not found.");

  const id = account.id;

  // Two ways to lock everyone out of the app; both refused.
  if (id === c.get("user").id) {
    return failure(c, "CANNOT_DELETE_SELF", "You cannot delete the account you are signed in as.", 409);
  }
  if (account.role === "MANAGER" && (await countManagers(c.env.DB)) <= 1) {
    return failure(c, "LAST_MANAGER_REQUIRED", "At least one manager account must remain.", 409);
  }

  await deleteAccount(c.env.DB, id);
  return ok(c, { ok: true }, "Account deleted.");
});
