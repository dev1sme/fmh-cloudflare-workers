export type Role = "MANAGER" | "TENANT";

export type SessionUser = {
  id: number;
  username: string;
  role: Role;
  /** Null for `quan_ly`; the room the account belongs to for `nguoi_thue`. */
  room_id: number | null;
};

export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: SessionUser;
  };
};
