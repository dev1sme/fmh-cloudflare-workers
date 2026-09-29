/**
 * Public codes used in URLs instead of row ids.
 *
 * Every table a path can address gets one: a two-letter prefix naming the
 * resource, then four random bytes as uppercase hex. The prefix means a code
 * cannot be used against the wrong resource by accident — `RM…` in an invoice
 * path is a 400, not a lookup that happens to miss.
 *
 * Uppercase hex rather than Base32 or Base62 because `HD…` is typed by hand
 * into a bank transfer memo: `0-9A-F` has no O/I/l to be misread as 0/1. The
 * others are never typed, but sharing one alphabet keeps the parsing single.
 *
 * Four bytes give 4.3 billion values per prefix. At the scale this app is
 * built for the birthday collision is unreachable, and every table's unique
 * index catches it regardless.
 */
export const CODE_PREFIX = {
  invoice: "HD",
  room: "RM",
  tenant: "TN",
  account: "AC",
  reading: "RD",
  payment: "PM",
  bot: "BT",
  botTarget: "TG",
} as const;

export type CodePrefix = (typeof CODE_PREFIX)[keyof typeof CODE_PREFIX];

const CODE_BYTES = 4;

export function generateCode(prefix: CodePrefix): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_BYTES));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}${hex.toUpperCase()}`;
}

/** SQL for the same shape, used by migrations to backfill existing rows. */
export function codePattern(prefix: CodePrefix): RegExp {
  return new RegExp(`^${prefix}[0-9A-F]{8}$`);
}
