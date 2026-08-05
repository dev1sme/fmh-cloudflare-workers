import type { Role } from "../types";

export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  role: Role;
  room_id: number | null;
};

/** What the account screen shows. Never includes password_hash. */
export type AccountRow = {
  id: number;
  username: string;
  role: Role;
  room_id: number | null;
  room_name: string | null;
};

export function getUserByUsername(db: D1Database, username: string): Promise<UserRow | null> {
  return db
    .prepare("SELECT id, username, password_hash, role, room_id FROM users WHERE username = ?")
    .bind(username)
    .first<UserRow>();
}

export async function listAccounts(db: D1Database): Promise<AccountRow[]> {
  const { results } = await db
    .prepare(
      `SELECT u.id, u.username, u.role, u.room_id, r.room_name
       FROM users u
       LEFT JOIN rooms r ON r.id = u.room_id
       ORDER BY u.role, r.room_name, u.username`,
    )
    .all<AccountRow>();
  return results;
}

export function getAccount(db: D1Database, id: number): Promise<AccountRow | null> {
  return db
    .prepare(
      `SELECT u.id, u.username, u.role, u.room_id, r.room_name
       FROM users u
       LEFT JOIN rooms r ON r.id = u.room_id
       WHERE u.id = ?`,
    )
    .bind(id)
    .first<AccountRow>();
}

export type AccountInput = {
  username: string;
  password_hash: string;
  role: Role;
  room_id: number | null;
};

export async function createAccount(
  db: D1Database,
  input: AccountInput,
): Promise<AccountRow | null> {
  const row = await db
    .prepare(
      `INSERT INTO users (username, password_hash, role, room_id)
       VALUES (?, ?, ?, ?) RETURNING id`,
    )
    .bind(input.username, input.password_hash, input.role, input.room_id)
    .first<{ id: number }>();

  return row ? getAccount(db, row.id) : null;
}

export async function renameAccount(
  db: D1Database,
  id: number,
  username: string,
): Promise<AccountRow | null> {
  await db.prepare("UPDATE users SET username = ? WHERE id = ?").bind(username, id).run();
  return getAccount(db, id);
}

export async function setPasswordHash(
  db: D1Database,
  id: number,
  passwordHash: string,
): Promise<void> {
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(passwordHash, id).run();
}

export async function deleteAccount(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
}

/** Used to refuse deleting the last manager and locking everyone out. */
export async function countManagers(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'MANAGER'")
    .first<{ n: number }>();
  return row?.n ?? 0;
}
