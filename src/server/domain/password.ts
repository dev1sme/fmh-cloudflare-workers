/**
 * 64 symbols, so a random byte maps to one with `% 64` and no modulo bias
 * (256 is an exact multiple of 64). Visually ambiguous characters (l, I, 1, O,
 * 0) are left out — these passwords get read aloud and retyped by tenants.
 */
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_@#$%&*";

const DO_DAI = 20;

/** ~120 bits of entropy; shown once, never stored in plaintext. */
export function sinhMatKhau(length = DO_DAI): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export const DO_DAI_TOI_THIEU = 8;
