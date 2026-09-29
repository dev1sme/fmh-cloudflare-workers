import { Button, Modal, NumberInput, Select, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RoomDetail, TenantDetail } from "../../../../shared/types";
import type { TenantInput, TenantPatch } from "../../../api";
import { today } from "../../../format";

/** Adding when `tenant` is null, editing otherwise. */
export type TenantTarget = { tenant: TenantDetail | null } | null;

export function TenantModal({
  target,
  rooms,
  onClose,
  onCreate,
  onUpdate,
}: {
  target: TenantTarget;
  rooms: RoomDetail[];
  onClose: () => void;
  onCreate: (input: TenantInput) => Promise<boolean>;
  onUpdate: (code: string, patch: TenantPatch) => Promise<boolean>;
}) {
  const isEdit = target?.tenant ?? null;
  const { t } = useTranslation();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [occupants, setOccupants] = useState<number | string>(1);
  const [movedIn, setMovedIn] = useState(today());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;

    if (isEdit) {
      setRoomId(String(isEdit.room_id));
      setFullName(isEdit.full_name);
      setPhone(isEdit.phone ?? "");
      setOccupants(isEdit.occupants);
      setMovedIn(isEdit.moved_in);
      return;
    }

    setRoomId(rooms[0] ? String(rooms[0].id) : null);
    setFullName("");
    setPhone("");
    setOccupants(1);
    setMovedIn(today());
  }, [target, isEdit, rooms]);

  async function save() {
    if (!target) return;
    setBusy(true);

    const ok = isEdit
      ? await onUpdate(isEdit.code, {
          full_name: fullName,
          phone: phone || null,
          occupants: Number(occupants),
          moved_in: movedIn,
        })
      : await onCreate({
          room_id: Number(roomId),
          full_name: fullName,
          phone: phone || null,
          occupants: Number(occupants),
          moved_in: movedIn,
        });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal
      opened={target !== null}
      onClose={onClose}
      title={
        isEdit ? t("tenants.editTitle", { room: isEdit.room_name }) : t("tenants.add")
      }
    >
      <Stack>
        <Select
          label={t("tenants.room")}
          value={roomId}
          onChange={setRoomId}
          data={rooms.map((room) => ({ value: String(room.id), label: room.room_name }))}
          // Moving a tenancy between rooms would rewrite history; add a new one.
          disabled={isEdit !== null}
          allowDeselect={false}
        />
        <TextInput
          label={t("tenants.named")}
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
