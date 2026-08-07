import { Button, Modal, NumberInput, Select, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
  onUpdate: (code: string, patch: TenantPatch) => Promise<boolean>;
}) {
  const dangSua = target?.tenant ?? null;
  const { t } = useTranslation();

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
      ? await onUpdate(dangSua.code, {
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
      title={
        dangSua ? t("tenants.editTitle", { room: dangSua.room_name }) : t("tenants.add")
      }
    >
      <Stack>
        <Select
          label={t("tenants.room")}
          value={roomId}
          onChange={setRoomId}
          data={phong.map((room) => ({ value: String(room.id), label: room.room_name }))}
          // Moving a tenancy between rooms would rewrite history; add a new one.
          disabled={dangSua !== null}
          allowDeselect={false}
        />
        <TextInput
          label={t("tenants.named")}
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
