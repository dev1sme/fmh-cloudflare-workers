import { useState } from "react";

import { auth, type SessionUser } from "../../api";
import { errorMessage } from "../../errors";

/**
 * Login is the one place that shows the error inline instead of as a toast —
 * the message belongs next to the form the user is still looking at.
 */
export function useLogin(onLogin: (user: SessionUser) => void) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(username: string, password: string) {
    setBusy(true);
    setError(null);

    try {
      const { user } = await auth.login(username, password);
      onLogin(user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return { login, error, busy };
}
