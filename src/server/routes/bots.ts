import { Hono } from "hono";
import type { Context } from "hono";

import {
  createBot,
  createTarget,
  deleteBot,
  deleteTarget,
  getBotByCode,
  getBotTokenById,
  getTargetByCode,
  listBots,
  setBotToken,
  updateBot,
  updateTarget,
} from "../db/bots";
import { CODE_PREFIX, sinhMa } from "../domain/code";
import { docKhoa, maHoa } from "../domain/crypto";
import { bayGio } from "../domain/period";
import { failure, notFound, ok } from "../envelope";
import { guiThu } from "../notify";
import type { AppEnv } from "../types";
import type { BotPlatform, BotTargetKind } from "../../shared/types";
import {
  jsonBody,
  optionalBool,
  optionalEnum,
  parseCode,
  requireEnum,
  requireId,
  requireString,
} from "../validate";

const PLATFORMS: readonly BotPlatform[] = ["ZALO"];
const KINDS: readonly BotTargetKind[] = ["GROUP", "MANAGER"];

/** Zalo tokens are `<bot id>:<opaque>`; the cap is slack, not a format check. */
const TOKEN_MAX = 500;

export const botRoutes = new Hono<AppEnv>();
export const botTargetRoutes = new Hono<AppEnv>();

/**
 * Notification bots and where they send, manager only.
 *
 * The token is write-only across this whole surface: it goes in on create or on
 * `POST /:code/token`, and no response on any route contains it. `Bot` carries
 * `has_token` instead, which answers the only question the UI has. Same rule as
 * passwords in `auth.md` — a token that cannot be read back cannot be leaked by
 * a route that forgot to strip a field.
 */
botRoutes.get("/", async (c) => ok(c, { bots: await listBots(c.env.DB) }, "Bots retrieved."));

/**
 * Encrypts the token for storage, or refuses.
 *
 * 503 rather than 500: an unset key is a deployment that was never finished,
 * and writing a row whose token can never be decrypted would look like success
 * and fail silently at the next invoice run. Same shape as the SePay webhook's
 * answer to a missing signing secret.
 */
async function niemPhong(c: Context<AppEnv>, token: string): Promise<string | null> {
  const rawKey = docKhoa(c.env);
  if (!rawKey) return null;
  return maHoa(rawKey, token);
}

botRoutes.post("/", async (c) => {
  const body = await jsonBody(c.req);
  const name = requireString(body.name, "name", 100);
  const token = requireString(body.token, "token", TOKEN_MAX);
  const platform = optionalEnum(body.platform, "platform", PLATFORMS) ?? "ZALO";

  const sealed = await niemPhong(c, token);
  if (!sealed) {
    return failure(c, "ENCRYPTION_NOT_CONFIGURED", "Bot encryption key is not set.", 503);
  }

  const bot = await createBot(c.env.DB, {
    code: sinhMa(CODE_PREFIX.bot),
    name,
    platform,
    token: sealed,
    created_at: bayGio(),
  });

  return ok(c, { bot }, "Bot created.", 201);
});

botRoutes.patch("/:code", async (c) => {
  const code = parseCode(CODE_PREFIX.bot, c.req.param("code"));
  const body = await jsonBody(c.req);

  const bot = await updateBot(c.env.DB, code, {
    name: body.name === undefined ? undefined : requireString(body.name, "name", 100),
    active: optionalBool(body.active, "active"),
  });
  if (!bot) return notFound(c, "Bot not found.");

  return ok(c, { bot }, "Bot updated.");
});

/** Replaces the token. There is no endpoint that reads the old one back. */
botRoutes.post("/:code/token", async (c) => {
  const code = parseCode(CODE_PREFIX.bot, c.req.param("code"));
  const body = await jsonBody(c.req);
  const token = requireString(body.token, "token", TOKEN_MAX);

  const sealed = await niemPhong(c, token);
  if (!sealed) {
    return failure(c, "ENCRYPTION_NOT_CONFIGURED", "Bot encryption key is not set.", 503);
  }

  const bot = await setBotToken(c.env.DB, code, sealed);
  if (!bot) return notFound(c, "Bot not found.");

  return ok(c, { bot }, "Bot token replaced.");
});

/** 409 RELATED_DATA_EXISTS while the bot still has targets — the FK restricts. */
botRoutes.delete("/:code", async (c) => {
  await deleteBot(c.env.DB, parseCode(CODE_PREFIX.bot, c.req.param("code")));
  return ok(c, { ok: true }, "Bot deleted.");
});

/**
 * Adds a destination.
 *
 * `building_id` omitted means every building, which is what a setup with one
 * group wants. `kind` decides whether this chat is sent amounts, so it is
 * required — there is no sensible default between "sees the money" and
 * "does not".
 */
botRoutes.post("/:code/targets", async (c) => {
  const botCode = parseCode(CODE_PREFIX.bot, c.req.param("code"));
  const bot = await getBotByCode(c.env.DB, botCode);
  if (!bot) return notFound(c, "Bot not found.");

  const body = await jsonBody(c.req);

  const target = await createTarget(c.env.DB, {
    code: sinhMa(CODE_PREFIX.botTarget),
    bot_id: bot.id,
    kind: requireEnum(body.kind, "kind", KINDS),
    chat_id: requireString(body.chat_id, "chat_id", 100),
    label: requireString(body.label, "label", 100),
    building_id: body.building_id == null ? null : requireId(body.building_id, "building_id"),
  });

  return ok(c, { target }, "Target created.", 201);
});

/** `kind` is absent on purpose — see `updateTarget` in `db/bots.ts`. */
botTargetRoutes.patch("/:code", async (c) => {
  const code = parseCode(CODE_PREFIX.botTarget, c.req.param("code"));
  const body = await jsonBody(c.req);

  const target = await updateTarget(c.env.DB, code, {
    chat_id: body.chat_id === undefined ? undefined : requireString(body.chat_id, "chat_id", 100),
    label: body.label === undefined ? undefined : requireString(body.label, "label", 100),
    building_id:
      body.building_id === undefined
        ? undefined
        : body.building_id === null
          ? null
          : requireId(body.building_id, "building_id"),
    active: optionalBool(body.active, "active"),
  });
  if (!target) return notFound(c, "Target not found.");

  return ok(c, { target }, "Target updated.");
});

botTargetRoutes.delete("/:code", async (c) => {
  await deleteTarget(c.env.DB, parseCode(CODE_PREFIX.botTarget, c.req.param("code")));
  return ok(c, { ok: true }, "Target deleted.");
});

/**
 * Sends a test message to one target, and waits for the answer.
 *
 * Everything else queues its send and logs failures, because an invoice run
 * must not fail on Zalo being down. This is the opposite: the manager clicked
 * it to find out whether the chat id is right, so the result is the response.
 * The message names the target's label so a chat id pointing somewhere other
 * than the label claims is visible rather than passing as a success.
 */
botTargetRoutes.post("/:code/test", async (c) => {
  const code = parseCode(CODE_PREFIX.botTarget, c.req.param("code"));

  const target = await getTargetByCode(c.env.DB, code);
  if (!target) return notFound(c, "Target not found.");

  const sealed = await getBotTokenById(c.env.DB, target.bot_id);
  if (!sealed) return notFound(c, "Bot not found.");

  const result = await guiThu(c, target, sealed);
  if (!result.ok) {
    // The reason is Zalo's own description or a configuration problem, both of
    // which the manager needs to read. 502: the fault is upstream, not in the
    // request.
    const status = result.reason === "ENCRYPTION_NOT_CONFIGURED" ? 503 : 502;
    return failure(c, "TEST_MESSAGE_FAILED", `Test message failed: ${result.reason}`, status);
  }

  return ok(c, { ok: true }, "Test message sent.");
});
