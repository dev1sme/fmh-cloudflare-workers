import { Button, Group, Modal, NumberInput, Stack, Text, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ReadingDetail, RoomDetail } from "../../../../shared/types";
import { toastError } from "../../../errors";
import { today } from "../../../format";
import type { ReadingEntry } from "../useReadings";
import { Consumption } from "./Consumption";

export type ReadingTarget = { room: RoomDetail; reading: ReadingDetail | null };

export function ReadingModal({
  period,
  target,
  suggest,
  onClose,
  onSubmit,
}: {
  period: string;
  target: ReadingTarget | null;
  suggest: (roomId: number) => Promise<{ electricity_start: number; water_start: number; previous_period: string | null }>;
  onClose: () => void;
  onSubmit: (
    target: { roomId: number; readingCode: string | null },
    input: ReadingEntry,
  ) => Promise<boolean>;
}) {
  const [electricityStart, setElectricityStart] = useState<number | string>(0);
  const [electricityEnd, setElectricityEnd] = useState<number | string>(0);
  const [waterStart, setWaterStart] = useState<number | string>(0);
  const [waterEnd, setWaterEnd] = useState<number | string>(0);
  const [recordedOn, setRecordedOn] = useState(today());
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  /**
   * Editing shows the stored numbers; a new entry pulls the opening numbers
   * from the previous period so only the two new readings need typing.
   */
  useEffect(() => {
    if (!target) return;

    if (target.reading) {
      setElectricityStart(target.reading.electricity_start);
      setElectricityEnd(target.reading.electricity_end);
      setWaterStart(target.reading.water_start);
      setWaterEnd(target.reading.water_end);
      setRecordedOn(target.reading.recorded_on);
      setSuggestionNote(null);
      return;
    }

    setElectricityEnd(0);
    setWaterEnd(0);
    setRecordedOn(today());

    suggest(target.room.id)
      .then((suggestion) => {
        setElectricityStart(suggestion.electricity_start);
        setWaterStart(suggestion.water_start);
        setSuggestionNote(
          suggestion.previous_period
            ? t("readings.carriedFrom", { period: suggestion.previous_period })
            : t("readings.noPrevious"),
        );
      })
      .catch(toastError);
  }, [target, suggest, t]);

  async function save() {
    if (!target) return;
    setBusy(true);

    const ok = await onSubmit(
      { roomId: target.room.id, readingCode: target.reading?.code ?? null },
      {
        electricity_start: Number(electricityStart),
        electricity_end: Number(electricityEnd),
        water_start: Number(waterStart),
        water_end: Number(waterEnd),
        recorded_on: recordedOn,
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
        {suggestionNote && (
          <Text size="sm" c="dimmed">
            {suggestionNote}
          </Text>
        )}

        <Group grow>
          <NumberInput label={t("readings.electricityStart")} value={electricityStart} onChange={setElectricityStart} min={0} />
          <NumberInput label={t("readings.electricityEnd")} value={electricityEnd} onChange={setElectricityEnd} min={0} />
        </Group>
        <Group grow>
          <NumberInput label={t("readings.waterStart")} value={waterStart} onChange={setWaterStart} min={0} />
          <NumberInput label={t("readings.waterEnd")} value={waterEnd} onChange={setWaterEnd} min={0} />
        </Group>
        <TextInput
          type="date"
          label={t("readings.colRecordedOn")}
          value={recordedOn}
          onChange={(e) => setRecordedOn(e.currentTarget.value)}
        />

        {/* Two labelled figures rather than one sentence with two values
            spliced into it: the sentence only reads naturally in Vietnamese,
            and the labels already exist. */}
        <Text size="sm">
          {t("meter.electricityUsed")}:{" "}
          <Consumption from={Number(electricityStart)} to={Number(electricityEnd)} unit="kWh" /> ·{" "}
          {t("meter.waterUsed")}:{" "}
          <Consumption from={Number(waterStart)} to={Number(waterEnd)} unit="m³" />
        </Text>

        <Button onClick={save} loading={busy}>
          {t("common.save")}
        </Button>
      </Stack>
    </Modal>
  );
}
