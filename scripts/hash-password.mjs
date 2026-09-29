#!/usr/bin/env node
/**
 * Hashes an account password offline and prints the SQL to insert it.
 *
 *   node scripts/hash-password.mjs <username> [password] [--room <room_name>]
 *
 * Without --room the account is the manager (`MANAGER`); with it, the account
 * belongs to that room (`TENANT`) and can only read its own invoices and
 * meter history. Room names are unique per building, not globally — if two
 * buildings share one, the subquery picks either; create that account from
 * the Tài khoản screen instead. Accounts are bound to a room, not to a person: when a tenant
 * moves out, change the password rather than creating another account.
 *
 * The password is never stored anywhere by this script — copy it out of the
 * terminal into your password manager. Only the hash goes into D1.
 *
 * Iteration count is embedded in the record, so it can be changed later without
 * a migration: re-run this script and UPDATE the row. Keep it in step with
 * PBKDF2_ITERATIONS in src/server/auth.ts.
 *
 * 10k, not the OWASP-recommended 600k: Workers Free allows 10 ms of CPU per
 * request, and a login at 50k iterations measured 11-17 ms of CPU on Cloudflare.
 */

const ITERATIONS = 10_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

const argv = process.argv.slice(2);
const roomFlag = argv.indexOf("--room");
const roomName = roomFlag === -1 ? null : argv[roomFlag + 1];
if (roomFlag !== -1) argv.splice(roomFlag, 2);

const [username, providedPassword] = argv;

if (!username || (roomFlag !== -1 && !roomName)) {
  console.error("Usage: node scripts/hash-password.mjs <username> [password] [--room <room_name>]");
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

const role = roomName ? "TENANT" : "MANAGER";
const code = `AC${Buffer.from(crypto.getRandomValues(new Uint8Array(4))).toString("hex").toUpperCase()}`;
const roomExpression = roomName
  ? `(SELECT id FROM rooms WHERE room_name = '${sqlEscape(roomName)}')`
  : "NULL";

console.log();
console.log(`username : ${username}`);
console.log(`role     : ${role}${roomName ? ` (room ${roomName})` : ""}`);
if (!providedPassword) {
  console.log(`password : ${password}      <-- save this now, it is not stored anywhere`);
}
console.log();
console.log("-- Run against D1 (add --remote for production):");
console.log(
  `INSERT INTO users (code, username, password_hash, role, room_id) VALUES ('${code}', '${sqlEscape(username)}', '${record}', '${role}', ${roomExpression})`,
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
