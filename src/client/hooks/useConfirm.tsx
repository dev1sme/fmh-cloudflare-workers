import { useCallback, useState } from "react";

import { ConfirmModal } from "../components/ConfirmModal";

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  color?: string;
  /** Any return value is ignored; the dialog closes once it settles. */
  onConfirm: () => unknown;
};

/**
 * Replaces window.confirm — a native dialog cannot be styled or animated, and
 * it blocks the whole tab while open.
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *   <Button onClick={() => confirm({ title, message, onConfirm })} />
 *   {confirmDialog}
 */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const close = useCallback(() => setRequest(null), []);

  const accept = useCallback(async () => {
    if (!request) return;
    setBusy(true);

    try {
      await request.onConfirm();
    } finally {
      setBusy(false);
      setRequest(null);
    }
  }, [request]);

  const confirmDialog = (
    <ConfirmModal
      opened={request !== null}
      title={request?.title ?? ""}
      message={request?.message ?? ""}
      confirmLabel={request?.confirmLabel}
      color={request?.color}
      busy={busy}
      onConfirm={accept}
      onClose={close}
    />
  );

  return { confirm: setRequest, confirmDialog };
}
