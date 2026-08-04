import { Button, Group, Modal, NumberInput, Stack, Text, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

import type { ReadingDetail, RoomDetail } from "../../../../shared/types";
import { baoLoi } from "../../../errors";
import { homNay } from "../../../format";
import type { ChiSoNhap } from "../useChiSo";
import { TieuThu } from "./TieuThu";

export type MucTieu = { room: RoomDetail; reading: ReadingDetail | null };

export function ReadingModal({
  ky,
  target,
  goiY,
  onClose,
  onSubmit,
}: {
  ky: string;
  target: MucTieu | null;
  goiY: (roomId: number) => Promise<{ dien_cu: number; nuoc_cu: number; ky_truoc: string | null }>;
  onClose: () => void;
  onSubmit: (
    target: { roomId: number; readingId: number | null },
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
      setDienCu(target.reading.dien_cu);
      setDienMoi(target.reading.dien_moi);
      setNuocCu(target.reading.nuoc_cu);
      setNuocMoi(target.reading.nuoc_moi);
      setNgayGhi(target.reading.ngay_ghi);
      setGhiChuGoiY(null);
      return;
    }

    setDienMoi(0);
    setNuocMoi(0);
    setNgayGhi(homNay());

    goiY(target.room.id)
      .then((suggestion) => {
        setDienCu(suggestion.dien_cu);
        setNuocCu(suggestion.nuoc_cu);
        setGhiChuGoiY(
          suggestion.ky_truoc
            ? `Chỉ số đầu kỳ lấy từ kỳ ${suggestion.ky_truoc}.`
            : "Chưa có kỳ trước, chỉ số đầu kỳ mặc định 0.",
        );
      })
      .catch(baoLoi);
  }, [target, goiY]);

  async function save() {
    if (!target) return;
    setBusy(true);

    const ok = await onSubmit(
      { roomId: target.room.id, readingId: target.reading?.id ?? null },
      {
        dien_cu: Number(dienCu),
        dien_moi: Number(dienMoi),
        nuoc_cu: Number(nuocCu),
        nuoc_moi: Number(nuocMoi),
        ngay_ghi: ngayGhi,
      },
    );

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal
      opened={target !== null}
      onClose={onClose}
      title={`Chỉ số ${target?.room.ten_phong ?? ""} — kỳ ${ky}`}
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
          Tiêu thụ: <TieuThu cu={Number(dienCu)} moi={Number(dienMoi)} donVi="kWh" /> điện,{" "}
          <TieuThu cu={Number(nuocCu)} moi={Number(nuocMoi)} donVi="m³" /> nước.
        </Text>

        <Button onClick={save} loading={busy}>
          Lưu
        </Button>
      </Stack>
    </Modal>
  );
}
