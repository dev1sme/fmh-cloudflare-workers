import { notifications } from "@mantine/notifications";

import { ApiError } from "./api";
import i18n from "./i18n";

/**
 * Turns an API error code into a sentence in the active language.
 *
 * The server never sends display text — `message` in the envelope is English
 * prose for logs and integrators, and the SPA does not render it. The code is
 * the contract, and this is the only place that decides what it reads as, so
 * adding a language costs a block in the locale files and nothing on the
 * server.
 */
export function thongBaoLoi(err: unknown): string {
  const code = err instanceof ApiError ? err.code : "";

  // Runtime-built keys are not literal types, hence the casts here and below.
  // `exists` guards against `t()` echoing an unknown key back at the user.
  if (code && i18n.exists(`errors.${code}` as never)) {
    return i18n.t(`errors.${code}` as never);
  }

  // Validation codes are generated from field names (MISSING_ROOM_NAME,
  // INVALID_RENT, TOO_LONG_FULL_NAME), so fall back to a readable form instead
  // of leaving the user with a raw code.
  const match = /^(MISSING|INVALID|TOO_LONG)_(.+)$/.exec(code);
  if (match) {
    const key = match[2]!.toLowerCase();
    const field = i18n.exists(`fields.${key}` as never)
      ? i18n.t(`fields.${key}` as never)
      : key.replace(/_/g, " ");

    if (match[1] === "MISSING") return i18n.t("errors.missingField", { field });
    if (match[1] === "TOO_LONG") return i18n.t("errors.tooLongField", { field });
    return i18n.t("errors.invalidField", { field });
  }

  return i18n.t("errors.fallback");
}

export function baoLoi(err: unknown): void {
  notifications.show({ color: "red", title: i18n.t("common.error"), message: thongBaoLoi(err) });
}

export function baoThanhCong(message: string): void {
  notifications.show({ color: "teal", message });
}
