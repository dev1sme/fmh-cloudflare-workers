import { Button, Group, Modal, NumberInput, Stack, Text, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

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
            ? `Chỉ số đầu kỳ lấy từ kỳ ${suggestion.previous_period}.`
            : "Chưa có kỳ trước, chỉ số đầu kỳ mặc định 0.",
        );
      })
      .catch(baoLoi);
  }, [target, goiY]);

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
      title={`Chỉ số ${target?.room.room_name ?? ""} — kỳ ${period}`}
    >
      <Stack>
        {ghiChuGoiY && (
          <Text size="sm" c="dimmed">
            {ghiChuGoiY}
          </Text>
        )}

        <Group grow>
          <NumberInput label="Điện cũ" value={dienCu} onChange={setDienCu} min={0} />
          <NumberInput label="Điện mới" value={dienMoi} onChange={setDienMoi} min={0} />
        </Group>
        <Group grow>
          <NumberInput label="Nước cũ" value={nuocCu} onChange={setNuocCu} min={0} />
          <NumberInput label="Nước mới" value={nuocMoi} onChange={setNuocMoi} min={0} />
        </Group>
        <TextInput
          type="date"
          label="Ngày ghi"
          value={ngayGhi}
          onChange={(e) => setNgayGhi(e.currentTarget.value)}
        />

        <Text size="sm">
          Tiêu thụ: <Consumption cu={Number(dienCu)} moi={Number(dienMoi)} donVi="kWh" /> điện,{" "}
          <Consumption cu={Number(nuocCu)} moi={Number(nuocMoi)} donVi="m³" /> nước.
        </Text>

        <Button onClick={save} loading={busy}>
          Lưu
        </Button>
      </Stack>
    </Modal>
  );
}
