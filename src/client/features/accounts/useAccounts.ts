import { useState } from "react";

import {
  accounts as accountsApi,
  rooms as roomsApi,
  type AccountInput,
  type AccountWithPassword,
} from "../../api";
import { toastError, toastSuccess } from "../../errors";
import i18n from "../../i18n";
import { useResource } from "../../hooks/useResource";

export function useAccountList() {
  const accounts = useResource(() => accountsApi.list(), []);
  const rooms = useResource(() => roomsApi.list(), []);

  return {
    accounts: accounts.data?.accounts ?? [],
    rooms: rooms.data?.rooms ?? [],
    loading: accounts.loading || rooms.loading,
    refreshing: accounts.refreshing || rooms.refreshing,
    error: accounts.error ?? rooms.error,
    // Both: `error` can be either request's, so a retry has to cover both.
    reload: () => {
      accounts.reload();
      rooms.reload();
    },
  };
}

/**
 * Mutations plus the one-shot password.
 *
 * `newPassword` holds the plaintext the server just generated so the screen can
 * show it once; clearing it is the only place it exists. Nothing reads a
 * password back from the API.
 */
export function useAccountActions(reload: () => void) {
  const [newPassword, setNewPassword] = useState<AccountWithPassword | null>(null);

  async function add(input: AccountInput): Promise<boolean> {
    try {
      setNewPassword(await accountsApi.create(input));
      toastSuccess(i18n.t("accounts.created"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function rename(code: string, username: string): Promise<boolean> {
    try {
      await accountsApi.rename(code, username);
      toastSuccess(i18n.t("accounts.renamed"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  /** No current password required — the manager is resetting someone else's. */
  async function resetPassword(code: string, password?: string): Promise<boolean> {
    try {
      setNewPassword(await accountsApi.resetPassword(code, password));
      toastSuccess(i18n.t("accounts.passwordReset"));
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function remove(code: string): Promise<boolean> {
    try {
      await accountsApi.remove(code);
      toastSuccess(i18n.t("accounts.deleted"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  return {
    add,
    rename,
    resetPassword,
    remove,
    newPassword,
    clearNewPassword: () => setNewPassword(null),
  };
}
