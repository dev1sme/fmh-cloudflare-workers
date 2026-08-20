/**
 * How to talk to a Zalo bot, and how the messages read.
 *
 * Deliberately knows nothing about which bots exist or who to send to — that is
 * `src/server/notify.ts`, which reads the `bots` / `bot_targets` rows and fans
 * out. Keeping the split means the message wording can be changed and read
 * without a database in the picture.
 */

const API = "https://bot-api.zaloplatforms.com";

/** The public URL tenants are pointed at. Only used inside message text. */
const APP_URL = "https://rentals.dev1sme.cloud";

/**
 * Sends one message. Throws on failure so the caller can decide — a fan-out
 * collects failures per destination rather than letting one dead chat stop the
 * rest, while the manager's "send test" surfaces the reason.
 */
export async function guiZalo(token: string, chatId: string, text: string): Promise<void> {
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
 * Escapes the characters Zalo's markdown parser would otherwise consume.
 *
 * Only ever applied to values that come from the database — a room name is
 * typed by the manager and could contain an underscore or an asterisk, which
 * would silently swallow the rest of the line into italics.
 */
function thoat(value: string): string {
  return value.replace(/([*_~`#>{}\\])/g, "\\$1");
}

/** "2026-08" -> "tháng 08/2026". The client has its own locale-aware version;
 *  this text is always Vietnamese and always goes to Zalo, so it stays here. */
function nhanKy(period: string): string {
  const [nam, thang] = period.split("-");
  return `tháng ${thang}/${nam}`;
}

function tien(n: number): string {
  return `${n.toLocaleString("vi-VN")} đ`;
}

/**
 * For a `GROUP` target: an invoice run happened. No room names, no amounts.
 *
 * Everything in this app avoids telling one tenant what another owes — invoice
 * codes are random so they cannot be guessed from each other, and the VietQR
 * payload is built in-house so no third party learns who owes what. A group
 * message listing every room's total would undo all of that in one line.
 */
export function vanBanHoaDonMoi(period: string, soLuong: number, tenNhaTro?: string): string {
  const dong = tenNhaTro ? `Đã phát hành cho **${soLuong} phòng** — ${thoat(tenNhaTro)}.` : `Đã phát hành cho **${soLuong} phòng**.`;

  return (
    `{big}**📄 Hóa đơn ${nhanKy(period)}**{/big}\n\n` +
    `${dong}\n` +
    `Mọi người vào app xem chi tiết và quét mã QR để thanh toán:\n\n` +
    APP_URL
  );
}

/** For a `MANAGER` target: money arrived, with the figures. */
export function vanBanDaNhanTien(input: {
  roomName: string;
  invoiceCode: string;
  soTien: number;
  conLai: number;
}): string {
  // Green for settled, amber for still owed — the same two signals the app's
  // own palette carries, so the message reads the way the screen does.
  const mau = input.conLai > 0 ? "orange" : "green";
  const ketLuan = input.conLai > 0 ? `Còn lại: **${tien(input.conLai)}**` : "✓ Đã thu đủ";

  return (
    `{${mau}}**💰 Đã nhận thanh toán**{/${mau}}\n\n` +
    `Phòng: **${thoat(input.roomName)}**\n` +
    `Số tiền: **${tien(input.soTien)}**\n` +
    `Hóa đơn: \`${thoat(input.invoiceCode)}\`\n\n` +
    `{${mau}}${ketLuan}{/${mau}}`
  );
}

/**
 * What the manager's "send test" button delivers.
 *
 * Says which target it landed on, because the whole point of the test is to
 * confirm a chat id points where the label claims — a generic "test" message
 * arriving in the wrong chat looks like a success.
 */
export function vanBanThu(label: string, kind: string): string {
  return (
    `{big}**🔔 Tin nhắn thử**{/big}\n\n` +
    `Đích: **${thoat(label)}** (${kind})\n` +
    `Nếu bạn đọc được tin này thì cấu hình bot đã đúng.`
  );
}
