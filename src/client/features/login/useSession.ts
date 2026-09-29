import { useCallback, useEffect, useState } from "react";

import { auth, type SessionUser } from "../../api";

export type SessionState =
  | { status: "loading" }
  | { status: "out" }
  | { status: "in"; user: SessionUser };

/**
 * Asks the API once who is logged in; the cookie is the source of truth.
 *
 * Nothing here touches the address bar. Where a signed-out visitor lands is
 * decided by the route tables in `routes.tsx` — see `LoginRoutes` for why a
 * stale path used to produce a 404 straight after a successful login, and why
 * a redirect in the table beats doing it here.
 */
export function useSession() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    auth
      .me()
      .then(({ user }) => setSession({ status: "in", user }))
      .catch(() => setSession({ status: "out" }));
  }, []);

  const onLoggedIn = useCallback(
    (user: SessionUser) => setSession({ status: "in", user }),
    [],
  );

  const logout = useCallback(async () => {
    await auth.logout().catch(() => undefined);
    setSession({ status: "out" });
  }, []);

  return { session, onLoggedIn, logout };
}
