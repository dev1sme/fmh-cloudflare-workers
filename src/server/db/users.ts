import type { Role } from "../types";

export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  vai_tro: Role;
  room_id: number | null;
};

export function getUserByUsername(db: D1Database, username: string): Promise<UserRow | null> {
  return db
    .prepare("SELECT id, username, password_hash, vai_tro, room_id FROM users WHERE username = ?")
    .bind(username)
    .first<UserRow>();
}
