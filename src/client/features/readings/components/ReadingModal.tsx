import { Button, Group, Modal, NumberInput, Stack, Text, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ReadingDetail, RoomDetail } from "../../../../shared/types";
import { baoLoi } from "../../../errors";
import { homNay } from "../../../format";
import type { ChiSoNhap } from "../useReadings";
import { Consumption } from "./Consumption";

export type MucTieu = { room: RoomDetail; reading: ReadingDetail | null };

export function ReadingModal({
  period,
  target,
  goiY,
  onClose,
  onSubmit,
}: {
  period: string;
  target: MucTieu | null;
  goiY: (roomId: number) => Promise<{ electricity_start: number; water_start: number; previous_period: string | null }>;
  onClose: () => void;
  onSubmit: (
    target: { roomId: number; readingCode: string | null },
    input: ChiSoNhap,
  ) => Promise<boolean>;
}) {
  const [dienCu, setDienCu] = useState<number | string>(0);
  const [dienMoi, setDienMoi] = useState<number | string>(0);
  const [nuocCu, setNuocCu] = useState<number | string>(0);
  const [nuocMoi, setNuocMoi] = useState<number | string>(0);
  const [ngayGhi, setNgayGhi] = useState(homNay());
  const [ghiChuGoiY, setGhiChuGoiY] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  /**
   * Editing shows the stored numbers; a new entry pulls the opening numbers
   * from the previous period so only the two new readings need typing.
   */
  useEffect(() => {
    if (!target) return;

    if (target.reading) {
      setDienCu(target.reading.electricity_start);
      setDienMoi(target.reading.electricity_end);
      setNuocCu(target.reading.water_start);
      setNuocMoi(target.reading.water_end);
      setNgayGhi(target.reading.recorded_on);
      setGhiChuGoiY(null);
      return;
    }

    setDienMoi(0);
    setNuocMoi(0);
    setNgayGhi(homNay());

    goiY(target.room.id)
      .then((suggestion) => {
        setDienCu(suggestion.electricity_start);
        setNuocCu(suggestion.water_start);
        setGhiChuGoiY(
          suggestion.previous_period
            ? t("readings.carriedFrom", { period: suggestion.previous_period })
            : t("readings.noPrevious"),
        );
      })
      .catch(baoLoi);
  }, [target, goiY, t]);

  async function save() {
    if (!target) return;
    setBusy(true);

    const ok = await onSubmit(
      { roomId: target.room.id, readingCode: target.reading?.code ?? null },
      {
        electricity_start: Number(dienCu),
        electricity_end: Number(dienMoi),
        water_start: Number(nuocCu),
        water_end: Number(nuocMoi),
        recorded_on: ngayGhi,
      },
    );

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal
      opened={target !== null}
      onClose={onClose}
      title={t("readings.modalTitle", { room: target?.room.room_name ?? "", period })}
    >
      <Stack>
        {ghiChuGoiY && (
          <Text size="sm" c="dimmed">
            {ghiChuGoiY}
          </Text>
        )}

        <Group grow>
          <NumberInput label={t("readings.electricityStart")} value={dienCu} onChange={setDienCu} min={0} />
          <NumberInput label={t("readings.electricityEnd")} value={dienMoi} onChange={setDienMoi} min={0} />
        </Group>
        <Group grow>
          <NumberInput label={t("readings.waterStart")} value={nuocCu} onChange={setNuocCu} min={0} />
          <NumberInput label={t("readings.waterEnd")} value={nuocMoi} onChange={setNuocMoi} min={0} />
        </Group>
        <TextInput
          type="date"
          label={t("readings.colRecordedOn")}
          value={ngayGhi}
          onChange={(e) => setNgayGhi(e.currentTarget.value)}
        />

        {/* Two labelled figures rather than one sentence with two values
            spliced into it: the sentence only reads naturally in Vietnamese,
            and the labels already exist. */}
        <Text size="sm">
          {t("meter.electricityUsed")}:{" "}
          <Consumption cu={Number(dienCu)} moi={Number(dienMoi)} donVi="kWh" /> ·{" "}
          {t("meter.waterUsed")}:{" "}
          <Consumption cu={Number(nuocCu)} moi={Number(nuocMoi)} donVi="m³" />
        </Text>

        <Button onClick={save} loading={busy}>
          {t("common.save")}
        </Button>
      </Stack>
    </Modal>
  );
}
