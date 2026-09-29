import { useState } from "react";

import { auth } from "../../api";
import { toastSuccess, errorMessage } from "../../errors";
import i18n from "../../i18n";

/**
 * Self-service password change. Shows the error inline rather than as a toast:
 * "wrong current password" belongs next to the field the user is looking at.
 */
export function useChangePassword() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    setBusy(true);
    setError(null);

    try {
      await auth.changePassword(currentPassword, newPassword);
      // `i18n.t`, not the hook: this is a plain function, not a component.
      toastSuccess(i18n.t("changePassword.done"));
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { changePassword, error, busy };
}
