export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
};

export function getUserByUsername(db: D1Database, username: string): Promise<UserRow | null> {
  return db
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
    .bind(username)
    .first<UserRow>();
}

export async function countRooms(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM rooms").first<{ n: number }>();
  return row?.n ?? 0;
}
