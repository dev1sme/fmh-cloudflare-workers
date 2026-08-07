import { Button, Modal, NumberInput, Select, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Building, RoomDetail } from "../../../../shared/types";
import type { RoomInput } from "../../../api";
import { dauPhanCach } from "../../../format";

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
  onUpdate: (code: string, patch: Partial<RoomInput>) => Promise<boolean>;
}) {
  const dangSua = target?.room ?? null;
  const { t } = useTranslation();

  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [tenPhong, setTenPhong] = useState("");
  const [giaPhong, setGiaPhong] = useState<number | string>(0);
  const [dienTich, setDienTich] = useState<number | string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;

    if (dangSua) {
      setBuildingId(String(dangSua.building_id));
      setTenPhong(dangSua.room_name);
      setGiaPhong(dangSua.rent);
      setDienTich(dangSua.area ?? "");
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
      room_name: tenPhong,
      rent: Number(giaPhong),
      area: dienTich === "" ? null : Number(dienTich),
    };

    const ok = dangSua
      ? await onUpdate(dangSua.code, chung)
      : await onCreate({ building_id: Number(buildingId), ...chung });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal
      opened={target !== null}
      onClose={onClose}
      title={
        dangSua ? t("rooms.editTitle", { name: dangSua.room_name }) : t("rooms.add")
      }
    >
      <Stack>
        <Select
          label={t("rooms.building")}
          value={buildingId}
          onChange={setBuildingId}
          data={nha.map((item) => ({ value: String(item.id), label: item.name }))}
          // Moving a room between buildings would change the tariff its past
          // invoices were priced from; create a new room instead.
          disabled={dangSua !== null}
          allowDeselect={false}
        />
        <TextInput
          label={t("rooms.name")}
          placeholder="FMH-P03"
          value={tenPhong}
          onChange={(e) => setTenPhong(e.currentTarget.value)}
          required
        />
        <NumberInput
          label={t("rooms.rentField")}
          value={giaPhong}
          onChange={setGiaPhong}
          min={0}
          step={100000}
          {...dauPhanCach()}
        />
        <NumberInput
          label={t("rooms.areaField")}
          value={dienTich}
          onChange={setDienTich}
          min={0}
          allowDecimal
        />
        <Button onClick={save} loading={busy}>
          {t("common.save")}
        </Button>
      </Stack>
    </Modal>
  );
}
