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
export async function sendZalo(token: string, chatId: string, text: string): Promise<void> {
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
function escapeMarkdown(value: string): string {
  return value.replace(/([*_~`#>{}\\])/g, "\\$1");
}

/** "2026-08" -> "tháng 08/2026". The client has its own locale-aware version;
 *  this text is always Vietnamese and always goes to Zalo, so it stays here. */
function periodLabel(period: string): string {
  const [year, month] = period.split("-");
  return `tháng ${month}/${year}`;
}

function formatMoney(n: number): string {
  return `${n.toLocaleString("vi-VN")} đ`;
}

/**
 * For a `GROUP` target: an invoice run happened. No room names, no amounts.
 *
 * Everything in this app avoids telling one tenant what another owes — invoice
 * codes are random so they cannot be guessed from each other, and the VietQR
 * payload is built in-house so no third party learns who owes what. A group
 * message listing every room's total would undo all of that in one line.
 *
 * The room count is deliberately absent too, and the building name carries what
 * is left of the distinction. One run bills each building separately, so a
 * global group target receives one message per building — without the name they
 * would be byte-identical and read as a duplicate rather than as two notices.
 *
 * The closing note exists because a transfer that does not go through the QR
 * carries no invoice code in its memo, so the SePay webhook cannot match it to
 * an invoice and the payment silently never lands. Asking for a heads-up in the
 * group is cheaper than reconciling the bank statement by hand.
 */
export function invoicesIssuedText(period: string, buildingName?: string): string {
  const heading = buildingName
    ? `📄 Hóa đơn ${periodLabel(period)} — ${escapeMarkdown(buildingName)}`
    : `📄 Hóa đơn ${periodLabel(period)}`;

  return (
    `{big}**${heading}**{/big}\n\n` +
    `Mọi người vào app xem chi tiết và quét mã QR để thanh toán:\n\n` +
    `${APP_URL}\n\n` +
    // Only the label is coloured, not the sentence. A whole red paragraph in a
    // routine monthly notice reads as an alarm and stops being read by the
    // third month; the label alone is enough to make the eye stop.
    `{red}**Lưu ý:**{/red} Nếu mọi người thanh toán bằng tiền mặt hoặc chuyển vào số tài khoản khác ` +
    `(không phải dùng mã QR) vui lòng nhắn trực tiếp lên group để được kiểm tra và cập nhật.`
  );
}

/** For a `MANAGER` target: money arrived, with the figures. */
export function paymentReceivedText(input: {
  roomName: string;
  invoiceCode: string;
  amount: number;
  outstanding: number;
}): string {
  // Green for settled, amber for still owed — the same two signals the app's
  // own palette carries, so the message reads the way the screen does.
  const colour = input.outstanding > 0 ? "orange" : "green";
  const balanceLine = input.outstanding > 0 ? `Còn lại: **${formatMoney(input.outstanding)}**` : "✓ Đã thu đủ";

  return (
    `{${colour}}**💰 Đã nhận thanh toán**{/${colour}}\n\n` +
    `Phòng: **${escapeMarkdown(input.roomName)}**\n` +
    `Số tiền: **${formatMoney(input.amount)}**\n` +
    `Hóa đơn: \`${escapeMarkdown(input.invoiceCode)}\`\n\n` +
    `{${colour}}${balanceLine}{/${colour}}`
  );
}

/**
 * What the manager's "send test" button delivers.
 *
 * Says which target it landed on, because the whole point of the test is to
 * confirm a chat id points where the label claims — a generic "test" message
 * arriving in the wrong chat looks like a success.
 */
export function testMessageText(label: string, kind: string): string {
  return (
    `{big}**🔔 Tin nhắn thử**{/big}\n\n` +
    `Đích: **${escapeMarkdown(label)}** (${kind})\n` +
    `Nếu bạn đọc được tin này thì cấu hình bot đã đúng.`
  );
}
