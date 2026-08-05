import { Button, Modal, NumberInput, Select, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

import type { RoomDetail, TenantDetail } from "../../../../shared/types";
import type { TenantInput, TenantPatch } from "../../../api";
import { homNay } from "../../../format";

/** Adding when `tenant` is null, editing otherwise. */
export type MucTieuNguoiThue = { tenant: TenantDetail | null } | null;

export function TenantModal({
  target,
  phong,
  onClose,
  onCreate,
  onUpdate,
}: {
  target: MucTieuNguoiThue;
  phong: RoomDetail[];
  onClose: () => void;
  onCreate: (input: TenantInput) => Promise<boolean>;
  onUpdate: (id: number, patch: TenantPatch) => Promise<boolean>;
}) {
  const dangSua = target?.tenant ?? null;

  const [roomId, setRoomId] = useState<string | null>(null);
  const [hoTen, setHoTen] = useState("");
  const [phone, setSdt] = useState("");
  const [soNguoi, setSoNguoi] = useState<number | string>(1);
  const [ngayVao, setNgayVao] = useState(homNay());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;

    if (dangSua) {
      setRoomId(String(dangSua.room_id));
      setHoTen(dangSua.full_name);
      setSdt(dangSua.phone ?? "");
      setSoNguoi(dangSua.occupants);
      setNgayVao(dangSua.moved_in);
      return;
    }

    setRoomId(phong[0] ? String(phong[0].id) : null);
    setHoTen("");
    setSdt("");
    setSoNguoi(1);
    setNgayVao(homNay());
  }, [target, dangSua, phong]);

  async function save() {
    if (!target) return;
    setBusy(true);

    const ok = dangSua
      ? await onUpdate(dangSua.id, {
          full_name: hoTen,
          phone: phone || null,
          occupants: Number(soNguoi),
          moved_in: ngayVao,
        })
      : await onCreate({
          room_id: Number(roomId),
          full_name: hoTen,
          phone: phone || null,
          occupants: Number(soNguoi),
          moved_in: ngayVao,
        });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal
      opened={target !== null}
      onClose={onClose}
      title={dangSua ? `Sửa người thuê — ${dangSua.room_name}` : "Thêm người thuê"}
    >
      <Stack>
        <Select
          label="Phòng"
          value={roomId}
          onChange={setRoomId}
          data={phong.map((room) => ({ value: String(room.id), label: room.room_name }))}
          // Moving a tenancy between rooms would rewrite history; add a new one.
          disabled={dangSua !== null}
          allowDeselect={false}
        />
        <TextInput
          label="Người đứng tên"
          value={hoTen}
          onChange={(e) => setHoTen(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Số điện thoại"
          value={phone}
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
