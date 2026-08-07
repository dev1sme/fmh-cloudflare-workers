import { useCallback, useEffect, useState } from "react";

import { auth, type SessionUser } from "../../api";

export type TrangThaiPhien =
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
  const [phien, setPhien] = useState<TrangThaiPhien>({ status: "loading" });

  useEffect(() => {
    auth
      .me()
      .then(({ user }) => setPhien({ status: "in", user }))
      .catch(() => setPhien({ status: "out" }));
  }, []);

  const dangNhapXong = useCallback(
    (user: SessionUser) => setPhien({ status: "in", user }),
    [],
  );

  const dangXuat = useCallback(async () => {
    await auth.logout().catch(() => undefined);
    setPhien({ status: "out" });
  }, []);

  return { phien, dangNhapXong, dangXuat };
}
