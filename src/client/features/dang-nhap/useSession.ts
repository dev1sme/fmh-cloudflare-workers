import { useCallback, useEffect, useState } from "react";

import { auth, type SessionUser } from "../../api";

export type TrangThaiPhien =
  | { status: "loading" }
  | { status: "out" }
  | { status: "in"; user: SessionUser };

/** Asks the API once who is logged in; the cookie is the source of truth. */
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
