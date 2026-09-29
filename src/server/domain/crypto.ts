/**
 * Symmetric encryption for credentials that have to live in D1.
 *
 * Everything else in this app keeps credentials out of the database: a password
 * is stored as a PBKDF2 hash, and every secret comes from `wrangler secret put`.
 * Bot tokens cannot follow either rule — they must be usable (so not hashed)
 * and there can be any number of them (so not one secret per bot). Encrypting
 * them under a single key keeps the "no usable credential in a row" property
 * while letting the manager add a bot from the UI.
 *
 * What that actually defends against is not an attacker with a Worker: it is a
 * D1 export, an MCP `d1_database_query` (which project rules allow to read the
 * remote database unprompted), and a screenshot of a query result. Those are
 * the realistic ways a token gets out, and all three now see ciphertext.
 *
 * A Zalo bot token can post as the bot into every chat the bot belongs to, so
 * a leak is enough to send the tenants' group a fake invoice notice carrying
 * someone else's bank account. That is why this is not stored plainly.
 */

/**
 * Record format: `v1.<iv_b64>.<ciphertext_b64>`.
 *
 * The version prefix is there so a later key rotation or algorithm change can
 * still read what is already stored, instead of needing every row re-entered —
 * `decrypt` refuses anything carrying a version it does not know.
 */
const VERSION = "v1";
const IV_BYTES = 12;
const KEY_BYTES = 32;

/**
 * `null` when the key is not configured, so a route can answer 503 rather than
 * writing a row it will never be able to read back.
 */
export function readEncryptionKey(env: { BOT_ENCRYPTION_KEY?: string }): string | null {
  const raw = env.BOT_ENCRYPTION_KEY?.trim();
  return raw ? raw : null;
}

// One key for the whole Worker, so importing it once per isolate is safe and
// saves an import on every message sent. Keyed by the raw secret so a rotated
// value is never served from the cache of the old one.
let cache: { raw: string; key: CryptoKey } | null = null;

async function importKey(raw: string): Promise<CryptoKey> {
  if (cache?.raw === raw) return cache.key;

  const bytes = decodeBase64(raw);
  if (!bytes || bytes.length !== KEY_BYTES) {
    throw new Error(
      `BOT_ENCRYPTION_KEY must be ${KEY_BYTES} base64-encoded bytes — generate one with \`openssl rand -base64 ${KEY_BYTES}\``,
    );
  }

  const key = await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);

  cache = { raw, key };
  return key;
}

/**
 * A fresh random IV per call, never derived and never reused. Reusing an IV
 * under the same key in GCM does not just weaken it, it forfeits the whole
 * guarantee — two messages under one IV leak their XOR and the auth key.
 */
export async function encrypt(rawKey: string, plaintext: string): Promise<string> {
  const key = await importKey(rawKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const sealed = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  return [VERSION, encodeBase64(iv), encodeBase64(new Uint8Array(sealed))].join(".");
}

/**
 * `null` on anything that does not decrypt — wrong key, truncated record, a
 * row written before the format existed. A caller sending notifications skips
 * that bot instead of failing the invoice run that triggered it; GCM's tag is
 * what makes "does not decrypt" also mean "was tampered with".
 */
export async function decrypt(rawKey: string, record: string): Promise<string | null> {
  const parts = record.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION) return null;

  const iv = decodeBase64(parts[1]!);
  const sealed = decodeBase64(parts[2]!);
  if (!iv || iv.length !== IV_BYTES || !sealed) return null;

  try {
    const key = await importKey(rawKey);
    const opened = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, sealed);
    return new TextDecoder().decode(opened);
  } catch {
    return null;
  }
}

/** Shared with `auth.ts`, which encodes salts and hashes the same way. */
export function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function decodeBase64(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}
