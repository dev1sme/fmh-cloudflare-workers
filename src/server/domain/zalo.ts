import type { Context } from "hono";

import type { AppEnv } from "../types";

const API = "https://bot-api.zaloplatforms.com";

/** The public URL tenants are pointed at. Only used inside message text. */
const APP_URL = "https://rentals.dev1sme.cloud";

type Nguoi = "group" | "quanLy";

/**
 * Notifications through a Zalo bot.
 *
 * Two destinations, and the difference is deliberate. The **group** holds the
 * tenants, so what goes there says an invoice exists and nothing else — no
 * room, no amount. Everything in this app avoids telling one tenant what
 * another owes: invoice codes are random so they cannot be guessed from each
 * other, and the VietQR payload is built in-house so no third party learns who
 * owes what. A group message listing every room's total would undo that in one
 * line. The **manager** gets the figures, privately.
 *
 * Sending is best-effort and must never break the thing that triggered it. An
 * invoice run that fails because Zalo is down has done real damage; a missing
 * notification has not.
 */
function diaChi(c: Context<AppEnv>, nguoi: Nguoi): string | undefined {
  const id = nguoi === "group" ? c.env.ZALO_GROUP_CHAT_ID : c.env.ZALO_MANAGER_CHAT_ID;
  return id?.trim() ? id.trim() : undefined;
}

/**
 * Escapes the characters Zalo's markdown parser would otherwise consume.
 *
 * Only ever applied to values that come from the database — a room name is
 * typed by the manager and could contain an underscore or an asterisk, which
 * would silently swallow the rest of the line into italics.
 */
function thoat(value: string): string {
  return value.replace(/([*_~`#>{}\\])/g, "\\$1");
}

async function gui(c: Context<AppEnv>, nguoi: Nguoi, text: string): Promise<void> {
  const token = c.env.ZALO_BOT_TOKEN?.trim();
  const chatId = diaChi(c, nguoi);

  // An empty value is how the integration is turned off — no token, no chat id,
  // no message, no error.
  if (!token || !chatId) return;

  const res = await fetch(`${API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `markdown` rather than `text_styles`. The styles array positions every
    // run by UTF-16 code unit, and these messages contain emoji, which are two
    // units each — one miscounted offset and the wrong words are bold. Markdown
    // has no offsets to get wrong.
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "markdown" }),
  });

  // The API answers 200 with `{"ok": false}` on failure, so the status code
  // alone does not tell you whether the message went out.
  const body = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!body?.ok) {
    throw new Error(`Zalo sendMessage failed: ${body?.description ?? res.status}`);
  }
}

/**
 * Runs a send without letting it affect the request that triggered it.
 *
 * `waitUntil` lets the response go back immediately and finishes the send
 * afterwards — which matters most for the SePay webhook, where the caller
 * gives up after 30 seconds and retries anything it does not get an answer to.
 * Waiting on Zalo there would risk a duplicate delivery to save nothing.
 */
function nen(c: Context<AppEnv>, viec: Promise<void>): void {
  const nuot = viec.catch((err: unknown) => {
    console.error("Zalo notification failed", err);
  });

  c.executionCtx.waitUntil(nuot);
}

/** "2026-08" -> "tháng 08/2026". The client has its own locale-aware version;
 *  this text is always Vietnamese and always goes to Zalo, so it stays here. */
function nhanKy(period: string): string {
  const [nam, thang] = period.split("-");
  return `tháng ${thang}/${nam}`;
}

/** Tenants' group: an invoice run happened. No room names, no amounts. */
export function baoDaPhatHanhHoaDon(c: Context<AppEnv>, period: string, soLuong: number): void {
  if (soLuong <= 0) return;

  nen(
    c,
    gui(
      c,
      "group",
      `{big}**📄 Hóa đơn ${nhanKy(period)}**{/big}\n\n` +
        `Đã phát hành cho **${soLuong} phòng**.\n` +
        `Mọi người vào app xem chi tiết và quét mã QR để thanh toán:\n\n` +
        APP_URL,
    ),
  );
}

/** Manager only: money arrived, with the figures. */
export function baoDaNhanTien(
  c: Context<AppEnv>,
  input: { roomName: string; invoiceCode: string; soTien: number; conLai: number },
): void {
  const tien = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

  // Green for settled, amber for still owed — the same two signals the app's
  // own palette carries, so the message reads the way the screen does.
  const mau = input.conLai > 0 ? "orange" : "green";
  const ketLuan =
    input.conLai > 0 ? `Còn lại: **${tien(input.conLai)}**` : "✓ Đã thu đủ";

  nen(
    c,
    gui(
      c,
      "quanLy",
      `{${mau}}**💰 Đã nhận thanh toán**{/${mau}}\n\n` +
        `Phòng: **${thoat(input.roomName)}**\n` +
        `Số tiền: **${tien(input.soTien)}**\n` +
        `Hóa đơn: \`${thoat(input.invoiceCode)}\`\n\n` +
        `{${mau}}${ketLuan}{/${mau}}`,
    ),
  );
}
