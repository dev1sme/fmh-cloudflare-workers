#!/usr/bin/env node
/**
 * Hashes an admin password offline and prints the SQL to insert it.
 *
 *   node scripts/hash-password.mjs <username>              # generates a random password
 *   node scripts/hash-password.mjs <username> <password>   # uses the password you pass
 *
 * The password is never stored anywhere by this script — copy it out of the
 * terminal into your password manager. Only the hash goes into D1.
 *
 * Iteration count is embedded in the record, so it can be raised later without
 * a migration: re-run this script and UPDATE the row. It is kept at 50k because
 * Workers Free allows 10 ms of CPU per request (600k iterations costs ~65 ms).
 */

const ITERATIONS = 50_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

const [username, providedPassword] = process.argv.slice(2);

if (!username) {
  console.error("Usage: node scripts/hash-password.mjs <username> [password]");
  process.exit(1);
}

const password = providedPassword ?? generatePassword();

const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveBits"],
);
const bits = await crypto.subtle.deriveBits(
  { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
  key,
  KEY_BITS,
);

const record = [
  "pbkdf2",
  "sha256",
  ITERATIONS,
  base64(salt),
  base64(new Uint8Array(bits)),
].join("$");

console.log();
console.log(`username : ${username}`);
if (!providedPassword) {
  console.log(`password : ${password}      <-- save this now, it is not stored anywhere`);
}
console.log();
console.log("-- Run against D1 (add --remote for production):");
console.log(
  `INSERT INTO users (username, password_hash) VALUES ('${sqlEscape(username)}', '${record}')`,
);
console.log(`  ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash;`);
console.log();

function generatePassword() {
  // 24 chars from a 64-symbol alphabet ~ 144 bits of entropy.
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_@#";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function base64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}
