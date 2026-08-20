import type { Bot, BotPlatform, BotTarget, BotTargetKind, BotWithTargets } from "../../shared/types";
import { buildSet } from "./sql";

/**
 * `token` is absent from every SELECT a client can reach. It appears in exactly
 * one query — `dichDenGui`, which is only ever called from a notification send
 * — so there is no route that can return it by forgetting to strip a field.
 */
const BOT_COLUMNS = `id, code, name, platform, active, created_at,
                     token IS NOT NULL AND token <> '' AS has_token`;

const TARGET_COLUMNS = `id, code, bot_id, kind, chat_id, label, building_id, active`;

/** SQLite has no boolean type; D1 hands these back as 0/1 integers. */
type BotRow = Omit<Bot, "active" | "has_token"> & { active: number; has_token: number };
type TargetRow = Omit<BotTarget, "active"> & { active: number };

function doiBot(row: BotRow): Bot {
  return { ...row, active: row.active === 1, has_token: row.has_token === 1 };
}

function doiTarget(row: TargetRow): BotTarget {
  return { ...row, active: row.active === 1 };
}

/**
 * Every bot with its targets. Two statements in one `db.batch()` rather than a
 * join: a join would repeat each bot per target and need grouping back out, and
 * a bot with no targets yet — which is every bot for the minute between being
 * created and being pointed somewhere — would need an outer join to appear.
 */
export async function listBots(db: D1Database): Promise<BotWithTargets[]> {
  const [bots, targets] = await db.batch<BotRow | TargetRow>([
    db.prepare(`SELECT ${BOT_COLUMNS} FROM bots ORDER BY name`),
    db.prepare(`SELECT ${TARGET_COLUMNS} FROM bot_targets ORDER BY kind, label`),
  ]);

  const theoBot = new Map<number, BotTarget[]>();
  for (const row of (targets?.results ?? []) as TargetRow[]) {
    const target = doiTarget(row);
    const danhSach = theoBot.get(target.bot_id);
    if (danhSach) danhSach.push(target);
    else theoBot.set(target.bot_id, [target]);
  }

  return ((bots?.results ?? []) as BotRow[]).map((row) => ({
    ...doiBot(row),
    targets: theoBot.get(row.id) ?? [],
  }));
}

export async function getBotByCode(db: D1Database, code: string): Promise<Bot | null> {
  const row = await db
    .prepare(`SELECT ${BOT_COLUMNS} FROM bots WHERE code = ?`)
    .bind(code)
    .first<BotRow>();
  return row ? doiBot(row) : null;
}

/**
 * The stored (still encrypted) token, for the one caller that has to send with
 * it. Separate from `getBotByCode` on purpose: a route reaching for the bot
 * cannot pick the token up by accident, and `grep -n "token" routes/` shows
 * every place it is touched.
 */
export async function getBotTokenById(db: D1Database, botId: number): Promise<string | null> {
  const row = await db
    .prepare(`SELECT token FROM bots WHERE id = ?`)
    .bind(botId)
    .first<{ token: string }>();
  return row?.token ?? null;
}

export type BotInput = {
  code: string;
  name: string;
  platform: BotPlatform;
  /** Already encrypted by the caller — see `domain/crypto.ts`. */
  token: string;
  created_at: string;
};

export async function createBot(db: D1Database, input: BotInput): Promise<Bot | null> {
  const row = await db
    .prepare(
      `INSERT INTO bots (code, name, platform, token, created_at)
       VALUES (?, ?, ?, ?, ?) RETURNING ${BOT_COLUMNS}`,
    )
    .bind(input.code, input.name, input.platform, input.token, input.created_at)
    .first<BotRow>();
  return row ? doiBot(row) : null;
}

/**
 * Column names come from the literals below, never from the request body —
 * `buildSet` takes its columns from the keys it is handed, so `...body` here
 * would be an injection hole. Same rule at every other call site.
 */
export async function updateBot(
  db: D1Database,
  code: string,
  patch: { name?: string; active?: boolean },
): Promise<Bot | null> {
  const set = buildSet({
    name: patch.name,
    active: patch.active === undefined ? undefined : patch.active ? 1 : 0,
  });
  if (!set) return getBotByCode(db, code);

  const row = await db
    .prepare(`UPDATE bots SET ${set.clause} WHERE code = ? RETURNING ${BOT_COLUMNS}`)
    .bind(...set.values, code)
    .first<BotRow>();
  return row ? doiBot(row) : null;
}

/** Replaces the token outright. There is no path that reads the old one back. */
export async function setBotToken(
  db: D1Database,
  code: string,
  token: string,
): Promise<Bot | null> {
  const row = await db
    .prepare(`UPDATE bots SET token = ? WHERE code = ? RETURNING ${BOT_COLUMNS}`)
    .bind(token, code)
    .first<BotRow>();
  return row ? doiBot(row) : null;
}

/** 409 RELATED_DATA_EXISTS while the bot still has targets — the FK restricts. */
export async function deleteBot(db: D1Database, code: string): Promise<void> {
  await db.prepare(`DELETE FROM bots WHERE code = ?`).bind(code).run();
}

export async function listTargets(db: D1Database, botId: number): Promise<BotTarget[]> {
  const { results } = await db
    .prepare(`SELECT ${TARGET_COLUMNS} FROM bot_targets WHERE bot_id = ? ORDER BY kind, label`)
    .bind(botId)
    .all<TargetRow>();
  return results.map(doiTarget);
}

export async function getTargetByCode(db: D1Database, code: string): Promise<BotTarget | null> {
  const row = await db
    .prepare(`SELECT ${TARGET_COLUMNS} FROM bot_targets WHERE code = ?`)
    .bind(code)
    .first<TargetRow>();
  return row ? doiTarget(row) : null;
}

export type TargetInput = {
  code: string;
  bot_id: number;
  kind: BotTargetKind;
  chat_id: string;
  label: string;
  building_id: number | null;
};

export async function createTarget(
  db: D1Database,
  input: TargetInput,
): Promise<BotTarget | null> {
  const row = await db
    .prepare(
      `INSERT INTO bot_targets (code, bot_id, kind, chat_id, label, building_id)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING ${TARGET_COLUMNS}`,
    )
    .bind(input.code, input.bot_id, input.kind, input.chat_id, input.label, input.building_id)
    .first<TargetRow>();
  return row ? doiTarget(row) : null;
}

/**
 * `kind` is deliberately not patchable. Flipping GROUP to MANAGER changes
 * whether that chat is sent amounts and room names, so it has to be a delete
 * and a re-create rather than one mis-click away.
 */
export async function updateTarget(
  db: D1Database,
  code: string,
  patch: {
    chat_id?: string;
    label?: string;
    building_id?: number | null;
    active?: boolean;
  },
): Promise<BotTarget | null> {
  const set = buildSet({
    chat_id: patch.chat_id,
    label: patch.label,
    building_id: patch.building_id,
    active: patch.active === undefined ? undefined : patch.active ? 1 : 0,
  });
  if (!set) return getTargetByCode(db, code);

  const row = await db
    .prepare(`UPDATE bot_targets SET ${set.clause} WHERE code = ? RETURNING ${TARGET_COLUMNS}`)
    .bind(...set.values, code)
    .first<TargetRow>();
  return row ? doiTarget(row) : null;
}

export async function deleteTarget(db: D1Database, code: string): Promise<void> {
  await db.prepare(`DELETE FROM bot_targets WHERE code = ?`).bind(code).run();
}

/** A destination to send to: the bot's stored (encrypted) token and one chat. */
export type DiaChiGui = {
  bot_id: number;
  token: string;
  chat_id: string;
};

/**
 * Where one notification goes: every active target of the given kind, on an
 * active bot, scoped to a building.
 *
 * `building_id IS NULL` on a target means every building, so a setup that
 * never bothers with per-building routing keeps working with one row.
 */
export async function dichDenGui(
  db: D1Database,
  kind: BotTargetKind,
  buildingId: number | null,
): Promise<DiaChiGui[]> {
  const { results } = await db
    .prepare(
      `SELECT t.bot_id, b.token, t.chat_id
       FROM bot_targets t
       JOIN bots b ON b.id = t.bot_id
       WHERE t.active = 1 AND b.active = 1 AND t.kind = ?
         AND (t.building_id IS NULL OR t.building_id = ?)`,
    )
    .bind(kind, buildingId)
    .all<DiaChiGui>();
  return results;
}
