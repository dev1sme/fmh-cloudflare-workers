import { Button, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RoomDetail } from "../../../../shared/types";
import { homNay } from "../../../format";
import type { NguoiThueMoi } from "../useRooms";

export function MoveInModal({
  room,
  onClose,
  onSubmit,
}: {
  room: RoomDetail | null;
  onClose: () => void;
  onSubmit: (roomId: number, input: NguoiThueMoi) => Promise<boolean>;
}) {
  const [hoTen, setHoTen] = useState("");
  const [phone, setSdt] = useState("");
  const [soNguoi, setSoNguoi] = useState<number | string>(1);
  const [ngayVao, setNgayVao] = useState(homNay());
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!room) return;
    setHoTen("");
    setSdt("");
    setSoNguoi(1);
    setNgayVao(homNay());
  }, [room]);

  async function save() {
    if (!room) return;
    setBusy(true);

    const ok = await onSubmit(room.id, {
      full_name: hoTen,
      phone,
      occupants: Number(soNguoi),
      moved_in: ngayVao,
    });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal opened={room !== null} onClose={onClose} title={t("tenantForm.moveInTitle", { room: room?.room_name ?? "" })}>
      <Stack>
        <TextInput
          label={t("tenantForm.fullName")}
          value={hoTen}
          onChange={(e) => setHoTen(e.currentTarget.value)}
          required
        />
        <TextInput
          label={t("tenantForm.phone")}
          value={phone}
          onChange={(e) => setSdt(e.currentTarget.value)}
        />
        <NumberInput
          label={t("tenantForm.occupants")}
          description={t("tenantForm.occupantsHint")}
          value={soNguoi}
          onChange={setSoNguoi}
          min={1}
        />
        <TextInput
          type="date"
          label={t("tenantForm.movedIn")}
          value={ngayVao}
          onChange={(e) => setNgayVao(e.currentTarget.value)}
        />
        <Button onClick={save} loading={busy}>
          {t("common.save")}
        </Button>
      </Stack>
    </Modal>
  );
}
