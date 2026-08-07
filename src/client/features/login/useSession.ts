import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth, type SessionUser } from "../../api";

export type TrangThaiPhien =
  | { status: "loading" }
  | { status: "out" }
  | { status: "in"; user: SessionUser };

/**
 * Asks the API once who is logged in; the cookie is the source of truth.
 *
 * Whenever there is no session, the address bar is reset to `/`.
 *
 * The login screen renders over whatever path was already there, and each role
 * has its own route table, so a path left over from one session was being
 * handed to the next: sign out of a tenant account on
 * `/my-invoices/HD3C8EA506`, sign in as the manager, and the manager's table
 * has no such route — a 404 immediately after a successful login. The same
 * thing happened in reverse from a manager-only path like `/settings`.
 *
 * Doing it in an effect rather than inside `dangXuat` matters. Calling
 * `navigate` next to `setPhien` puts both in one render pass, and `AppRoutes`
 * — still mounted for that pass — resolves `/` through the outgoing role's
 * table first, landing on `/dashboard` instead. The effect runs after the
 * commit, once the login screen is up and no route table is mounted.
 *
 * It also covers the case `dangXuat` never sees: opening a deep link with an
 * expired cookie, where the session starts out as `out`. A tenant returning to
 * a bookmarked invoice loses the deep link, which is a fair trade — their
 * whole account is one screen, and `/` is where that link went anyway.
 *
 * `replace` keeps the stale path out of history, so Back cannot walk into it.
 */
export function useSession() {
  const [phien, setPhien] = useState<TrangThaiPhien>({ status: "loading" });
  const navigate = useNavigate();

  useEffect(() => {
    auth
      .me()
      .then(({ user }) => setPhien({ status: "in", user }))
      .catch(() => setPhien({ status: "out" }));
  }, []);

  useEffect(() => {
    if (phien.status === "out") navigate("/", { replace: true });
  }, [phien.status, navigate]);

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
