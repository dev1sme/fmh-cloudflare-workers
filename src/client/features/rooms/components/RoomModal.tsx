import { Button, Modal, NumberInput, Select, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Building, RoomDetail } from "../../../../shared/types";
import type { RoomInput } from "../../../api";
import { separators } from "../../../format";

/** Adding when `room` is null, editing otherwise. */
export type RoomTarget = { room: RoomDetail | null } | null;

export function RoomModal({
  target,
  buildings,
  onClose,
  onCreate,
  onUpdate,
}: {
  target: RoomTarget;
  buildings: Building[];
  onClose: () => void;
  onCreate: (input: RoomInput) => Promise<boolean>;
  onUpdate: (code: string, patch: Partial<RoomInput>) => Promise<boolean>;
}) {
  const isEdit = target?.room ?? null;
  const { t } = useTranslation();

  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("");
  const [rent, setRent] = useState<number | string>(0);
  const [area, setArea] = useState<number | string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;

    if (isEdit) {
      setBuildingId(String(isEdit.building_id));
      setRoomName(isEdit.room_name);
      setRent(isEdit.rent);
      setArea(isEdit.area ?? "");
      return;
    }

    setBuildingId(buildings[0] ? String(buildings[0].id) : null);
    setRoomName("");
    setRent(0);
    setArea("");
  }, [target, isEdit, buildings]);

  async function save() {
    if (!target) return;
    setBusy(true);

    const chung = {
      room_name: roomName,
      rent: Number(rent),
      area: area === "" ? null : Number(area),
    };

    const ok = isEdit
      ? await onUpdate(isEdit.code, chung)
      : await onCreate({ building_id: Number(buildingId), ...chung });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal
      opened={target !== null}
      onClose={onClose}
      title={
        isEdit ? t("rooms.editTitle", { name: isEdit.room_name }) : t("rooms.add")
      }
    >
      <Stack>
        <Select
          label={t("rooms.building")}
          value={buildingId}
          onChange={setBuildingId}
          data={buildings.map((item) => ({ value: String(item.id), label: item.name }))}
          // Moving a room between buildings would change the tariff its past
          // invoices were priced from; create a new room instead.
          disabled={isEdit !== null}
          allowDeselect={false}
        />
        <TextInput
          label={t("rooms.name")}
          placeholder="FMH-P03"
          value={roomName}
          onChange={(e) => setRoomName(e.currentTarget.value)}
          required
        />
        <NumberInput
          label={t("rooms.rentField")}
          value={rent}
          onChange={setRent}
          min={0}
          step={100000}
          {...separators()}
        />
        <NumberInput
          label={t("rooms.areaField")}
          value={area}
          onChange={setArea}
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
