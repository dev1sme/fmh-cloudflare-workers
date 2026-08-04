import { useCallback, useState } from "react";

import { ConfirmModal } from "../components/ConfirmModal";

export type YeuCauXacNhan = {
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
 *   const { xacNhan, hopThoai } = useConfirm();
 *   <Button onClick={() => xacNhan({ title, message, onConfirm })} />
 *   {hopThoai}
 */
export function useConfirm() {
  const [request, setRequest] = useState<YeuCauXacNhan | null>(null);
  const [busy, setBusy] = useState(false);

  const dong = useCallback(() => setRequest(null), []);

  const chapNhan = useCallback(async () => {
    if (!request) return;
    setBusy(true);

    try {
      await request.onConfirm();
    } finally {
      setBusy(false);
      setRequest(null);
    }
  }, [request]);

  const hopThoai = (
    <ConfirmModal
      opened={request !== null}
      title={request?.title ?? ""}
      message={request?.message ?? ""}
      confirmLabel={request?.confirmLabel}
      color={request?.color}
      busy={busy}
      onConfirm={chapNhan}
      onClose={dong}
    />
  );

  return { xacNhan: setRequest, hopThoai };
}
