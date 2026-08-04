export type SessionUser = {
  id: number;
  username: string;
};

export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: SessionUser;
  };
};
