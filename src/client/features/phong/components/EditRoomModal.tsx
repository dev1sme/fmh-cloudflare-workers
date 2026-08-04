import { Button, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

import type { RoomDetail } from "../../../../shared/types";
import type { RoomInput } from "../../../api";

export function EditRoomModal({
  room,
  onClose,
  onSubmit,
}: {
  room: RoomDetail | null;
  onClose: () => void;
  onSubmit: (id: number, patch: Partial<RoomInput>) => Promise<boolean>;
}) {
  const [tenPhong, setTenPhong] = useState("");
  const [giaPhong, setGiaPhong] = useState<number | string>(0);
  const [dienTich, setDienTich] = useState<number | string>("");
  const [busy, setBusy] = useState(false);

  // The modal stays mounted between openings, so re-seed whenever the selected
  // room changes.
  useEffect(() => {
    if (!room) return;
    setTenPhong(room.ten_phong);
    setGiaPhong(room.gia_phong);
    setDienTich(room.dien_tich ?? "");
  }, [room]);

  async function save() {
    if (!room) return;
    setBusy(true);

    const ok = await onSubmit(room.id, {
      ten_phong: tenPhong,
      gia_phong: Number(giaPhong),
      dien_tich: dienTich === "" ? null : Number(dienTich),
    });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal opened={room !== null} onClose={onClose} title="Sửa phòng">
      <Stack>
        <TextInput
          label="Tên phòng"
          value={tenPhong}
          onChange={(e) => setTenPhong(e.currentTarget.value)}
        />
        <NumberInput
          label="Giá phòng (đ/tháng)"
          value={giaPhong}
          onChange={setGiaPhong}
          min={0}
          step={100000}
          thousandSeparator="."
          decimalSeparator=","
        />
        <NumberInput
          label="Diện tích (m²)"
          value={dienTich}
          onChange={setDienTich}
          min={0}
          allowDecimal
        />
        <Button onClick={save} loading={busy}>
          Lưu
        </Button>
      </Stack>
    </Modal>
  );
}
