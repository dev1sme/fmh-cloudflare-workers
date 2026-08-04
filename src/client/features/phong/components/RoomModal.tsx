import { Button, Modal, NumberInput, Select, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

import type { Building, RoomDetail } from "../../../../shared/types";
import type { RoomInput } from "../../../api";

/** Adding when `room` is null, editing otherwise. */
export type MucTieuPhong = { room: RoomDetail | null } | null;

export function RoomModal({
  target,
  nha,
  onClose,
  onCreate,
  onUpdate,
}: {
  target: MucTieuPhong;
  nha: Building[];
  onClose: () => void;
  onCreate: (input: RoomInput) => Promise<boolean>;
  onUpdate: (id: number, patch: Partial<RoomInput>) => Promise<boolean>;
}) {
  const dangSua = target?.room ?? null;

  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [tenPhong, setTenPhong] = useState("");
  const [giaPhong, setGiaPhong] = useState<number | string>(0);
  const [dienTich, setDienTich] = useState<number | string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;

    if (dangSua) {
      setBuildingId(String(dangSua.building_id));
      setTenPhong(dangSua.ten_phong);
      setGiaPhong(dangSua.gia_phong);
      setDienTich(dangSua.dien_tich ?? "");
      return;
    }

    setBuildingId(nha[0] ? String(nha[0].id) : null);
    setTenPhong("");
    setGiaPhong(0);
    setDienTich("");
  }, [target, dangSua, nha]);

  async function save() {
    if (!target) return;
    setBusy(true);

    const chung = {
      ten_phong: tenPhong,
      gia_phong: Number(giaPhong),
      dien_tich: dienTich === "" ? null : Number(dienTich),
    };

    const ok = dangSua
      ? await onUpdate(dangSua.id, chung)
      : await onCreate({ building_id: Number(buildingId), ...chung });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal
      opened={target !== null}
      onClose={onClose}
      title={dangSua ? `Sửa phòng — ${dangSua.ten_phong}` : "Thêm phòng"}
    >
      <Stack>
        <Select
          label="Nhà"
          value={buildingId}
          onChange={setBuildingId}
          data={nha.map((item) => ({ value: String(item.id), label: item.name }))}
          // Moving a room between buildings would change the tariff its past
          // invoices were priced from; create a new room instead.
          disabled={dangSua !== null}
          allowDeselect={false}
        />
        <TextInput
          label="Tên phòng"
          placeholder="FMH-P03"
          value={tenPhong}
          onChange={(e) => setTenPhong(e.currentTarget.value)}
          required
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
