export type Role = "quan_ly" | "nguoi_thue";

export type SessionUser = {
  id: number;
  username: string;
  vai_tro: Role;
  /** Null for `quan_ly`; the room the account belongs to for `nguoi_thue`. */
  room_id: number | null;
};

export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: SessionUser;
  };
};
