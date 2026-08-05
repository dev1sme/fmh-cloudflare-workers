import { Button, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

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
  const [sdt, setSdt] = useState("");
  const [soNguoi, setSoNguoi] = useState<number | string>(1);
  const [ngayVao, setNgayVao] = useState(homNay());
  const [busy, setBusy] = useState(false);

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
      ho_ten: hoTen,
      sdt,
      so_nguoi: Number(soNguoi),
      ngay_vao: ngayVao,
    });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal opened={room !== null} onClose={onClose} title={`Thêm người thuê — ${room?.ten_phong}`}>
      <Stack>
        <TextInput
          label="Họ tên"
          value={hoTen}
          onChange={(e) => setHoTen(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Số điện thoại"
          value={sdt}
          onChange={(e) => setSdt(e.currentTarget.value)}
        />
        <NumberInput
          label="Số người ở"
          description="Tính cả người đứng tên"
          value={soNguoi}
          onChange={setSoNguoi}
          min={1}
        />
        <TextInput
          type="date"
          label="Ngày vào"
          value={ngayVao}
          onChange={(e) => setNgayVao(e.currentTarget.value)}
        />
        <Button onClick={save} loading={busy}>
          Lưu
        </Button>
      </Stack>
    </Modal>
  );
}
