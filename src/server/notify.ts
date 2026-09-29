import type { Context } from "hono";

import { listSendDestinations, type SendDestination } from "./db/bots";
import { readEncryptionKey, decrypt } from "./domain/crypto";
import { sendZalo, paymentReceivedText, invoicesIssuedText, testMessageText } from "./domain/zalo";
import type { BotTarget, BotTargetKind } from "../shared/types";
import type { AppEnv } from "./types";

/**
 * Who a notification goes to, and getting it there.
 *
 * Destinations are rows now, not environment variables, so there is no fixed
 * number of them — one group per building, several managers, a second bot, all
 * without touching code or redeploying. `domain/zalo.ts` owns the wire format
 * and the wording; this file owns the routing.
 *
 * Sending is best-effort and must never break the thing that triggered it. An
 * invoice run that fails because Zalo is down has done real damage; a missing
 * notification has not. Every path here either swallows its failure into a log
 * or is explicitly awaited by a route that reports the result (the test send).
 */

/**
 * Runs a send without letting it affect the request that triggered it.
 *
 * `waitUntil` lets the response go back immediately and finishes the send
 * afterwards — which matters most for the SePay webhook, where the caller
 * gives up after 30 seconds and retries anything it does not get an answer to.
 * Waiting on Zalo there would risk a duplicate delivery to save nothing.
 */
function runInBackground(c: Context<AppEnv>, task: Promise<unknown>): void {
  c.executionCtx.waitUntil(
    task.catch((err: unknown) => {
      console.error("Zalo notification failed", err);
    }),
  );
}

/**
 * Decrypts each bot's token once, not once per destination.
 *
 * A bot with three targets comes back from `listSendDestinations` as three rows carrying
 * the same ciphertext; decrypting per row would do the same AES-GCM work three
 * times. Cheap either way, but the grouping also gives one place to drop a bot
 * whose token will not decrypt.
 */
async function unsealToken(
  rawKey: string,
  destinations: SendDestination[],
): Promise<{ token: string; chatId: string }[]> {
  const tokensByBot = new Map<number, string>();
  const sends: { token: string; chatId: string }[] = [];

  for (const d of destinations) {
    if (!tokensByBot.has(d.bot_id)) {
      const token = await decrypt(rawKey, d.token);
      // A token that does not decrypt means the key was rotated without the
      // tokens being re-entered, or the row was tampered with. Skip the bot and
      // say so — silently sending nothing is how a broken integration looks
      // healthy for a month.
      if (!token) {
        console.error(`Bot ${d.bot_id}: token failed to decrypt — re-enter it in Thông báo`);
        continue;
      }
      tokensByBot.set(d.bot_id, token);
    }

    const token = tokensByBot.get(d.bot_id);
    if (token) sends.push({ token, chatId: d.chat_id });
  }

  return sends;
}

/**
 * Sends one text to every destination of a kind, and never rejects.
 *
 * `allSettled`, not `all`: with N destinations, one chat the bot was removed
 * from would otherwise abort the rest of the fan-out. Each failure is logged
 * with its chat id so the manager can tell which target to fix.
 */
async function broadcast(
  c: Context<AppEnv>,
  kind: BotTargetKind,
  buildingId: number | null,
  text: string,
): Promise<void> {
  const rawKey = readEncryptionKey(c.env);
  if (!rawKey) {
    console.error("BOT_ENCRYPTION_KEY is not set — notifications are off");
    return;
  }

  const destinations = await listSendDestinations(c.env.DB, kind, buildingId);
  if (destinations.length === 0) return;

  const sends = await unsealToken(rawKey, destinations);

  const results = await Promise.allSettled(
    sends.map(({ token, chatId }) => sendZalo(token, chatId, text)),
  );

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`Zalo send to ${sends[i]?.chatId} failed`, r.reason);
    }
  });
}

/**
 * Tenants' groups: an invoice run happened for one building.
 *
 * Called once per building rather than once per run, because a target can be
 * scoped to a building and a combined count would tell the wrong group how many
 * rooms were billed somewhere else.
 */
export function notifyInvoicesIssued(
  c: Context<AppEnv>,
  input: { buildingId: number; buildingName?: string; period: string; count: number },
): void {
  // `count` no longer appears in the message, but it still decides whether
  // there is anything to announce — a building that had nothing created gets no
  // notice at all.
  if (input.count <= 0) return;

  runInBackground(c, broadcast(c, "GROUP", input.buildingId, invoicesIssuedText(input.period, input.buildingName)));
}

/** Managers only, and with the figures. */
export function notifyPaymentReceived(
  c: Context<AppEnv>,
  input: {
    buildingId: number | null;
    roomName: string;
    invoiceCode: string;
    amount: number;
    outstanding: number;
  },
): void {
  runInBackground(c, broadcast(c, "MANAGER", input.buildingId, paymentReceivedText(input)));
}

/**
 * The manager's "send test" button. Awaited, unlike everything else here — the
 * whole point is to report back whether it worked, so a failure is returned to
 * the caller rather than logged and forgotten.
 */
export async function sendTestMessage(
  c: Context<AppEnv>,
  target: BotTarget,
  encryptedToken: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const rawKey = readEncryptionKey(c.env);
  if (!rawKey) return { ok: false, reason: "ENCRYPTION_NOT_CONFIGURED" };

  const token = await decrypt(rawKey, encryptedToken);
  if (!token) return { ok: false, reason: "TOKEN_UNREADABLE" };

  try {
    await sendZalo(token, target.chat_id, testMessageText(target.label, target.kind));
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: (err as Error).message };
  }
}
