import { Button, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RoomDetail } from "../../../../shared/types";
import { today } from "../../../format";
import type { NewTenant } from "../useRooms";

export function MoveInModal({
  room,
  onClose,
  onSubmit,
}: {
  room: RoomDetail | null;
  onClose: () => void;
  onSubmit: (roomId: number, input: NewTenant) => Promise<boolean>;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [occupants, setOccupants] = useState<number | string>(1);
  const [movedIn, setMovedIn] = useState(today());
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!room) return;
    setFullName("");
    setPhone("");
    setOccupants(1);
    setMovedIn(today());
  }, [room]);

  async function save() {
    if (!room) return;
    setBusy(true);

    const ok = await onSubmit(room.id, {
      full_name: fullName,
      phone,
      occupants: Number(occupants),
      moved_in: movedIn,
    });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal opened={room !== null} onClose={onClose} title={t("tenantForm.moveInTitle", { room: room?.room_name ?? "" })}>
      <Stack>
        <TextInput
          label={t("tenantForm.fullName")}
          value={fullName}
          onChange={(e) => setFullName(e.currentTarget.value)}
          required
        />
        <TextInput
          label={t("tenantForm.phone")}
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
        />
        <NumberInput
          label={t("tenantForm.occupants")}
          description={t("tenantForm.occupantsHint")}
          value={occupants}
          onChange={setOccupants}
          min={1}
        />
        <TextInput
          type="date"
          label={t("tenantForm.movedIn")}
          value={movedIn}
          onChange={(e) => setMovedIn(e.currentTarget.value)}
        />
        <Button onClick={save} loading={busy}>
          {t("common.save")}
        </Button>
      </Stack>
    </Modal>
  );
}
