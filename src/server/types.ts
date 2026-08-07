export type Role = "MANAGER" | "TENANT";

export type SessionUser = {
  id: number;
  username: string;
  role: Role;
  /** Null for `quan_ly`; the room the account belongs to for `nguoi_thue`. */
  room_id: number | null;
};

export type AppEnv = {
  /**
   * `Env` is generated from `wrangler.toml` by `npm run cf-typegen`, and both
   * secrets are declared there, so both are typed as present.
   *
   * `SEPAY_WEBHOOK_SECRET` is still widened to optional. The generated type
   * says what the config promises, not what the running Worker has: a Worker
   * deployed before the secret was set still answers requests, and the webhook
   * route has to notice that rather than compare against `undefined` and let
   * an unauthenticated caller write to `payments`.
   */
  Bindings: Env & {
    SEPAY_WEBHOOK_SECRET?: string;
    ZALO_BOT_TOKEN?: string;
    ZALO_GROUP_CHAT_ID?: string;
    ZALO_MANAGER_CHAT_ID?: string;
  };
  Variables: {
    user: SessionUser;
  };
};
