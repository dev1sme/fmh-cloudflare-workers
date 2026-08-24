import { Alert, Button, Modal, Select, Stack, TextInput } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Building, BotTargetKind } from "../../../../shared/types";
import type { BotTargetInput } from "../../../api";

/**
 * Adding a destination to a bot.
 *
 * The warning under `kind` is not decoration. `MANAGER` is sent room names and
 * amounts; pointing it at the tenants' shared group would show every tenant
 * what the others owe, which is the one thing the whole notification design
 * exists to avoid. The field is not editable afterwards for the same reason —
 * changing it is a delete and a re-create.
 */
export function TargetModal({
  opened,
  onClose,
  onSubmit,
  buildings,
}: {
  opened: boolean;
  onClose: () => void;
  onSubmit: (input: BotTargetInput) => Promise<boolean>;
  buildings: Building[];
}) {
  const [kind, setKind] = useState<BotTargetKind>("GROUP");
  const [label, setLabel] = useState("");
  const [chatId, setChatId] = useState("");
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!opened) return;
    setKind("GROUP");
    setLabel("");
    setChatId("");
    setBuildingId(null);
  }, [opened]);

  async function save() {
    setBusy(true);

    const ok = await onSubmit({
      kind,
      label,
      chat_id: chatId,
      building_id: buildingId === null ? null : Number(buildingId),
    });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t("bots.addTarget")}>
      <Stack>
        <Select
          label={t("bots.kind")}
          value={kind}
          onChange={(value) => setKind((value as BotTargetKind | null) ?? "GROUP")}
          data={[
            { value: "GROUP", label: t("bots.kindGroup") },
            { value: "MANAGER", label: t("bots.kindManager") },
          ]}
          allowDeselect={false}
        />

        {kind === "MANAGER" && (
          <Alert
            variant="light"
            color="owed"
            icon={<IconAlertTriangle size={16} stroke={1.8} />}
          >
            {t("bots.managerWarning")}
          </Alert>
        )}

        <TextInput
          label={t("bots.label")}
          placeholder={t("bots.labelPlaceholder")}
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          required
        />

        <TextInput
          label={t("bots.chatId")}
          description={t("bots.chatIdHint")}
          value={chatId}
          onChange={(e) => setChatId(e.currentTarget.value)}
          required
        />

        {/* Cleared means every building, which is what a single shared group wants. */}
        <Select
          label={t("bots.building")}
          description={t("bots.buildingHint")}
          value={buildingId}
          onChange={setBuildingId}
          data={buildings.map((b) => ({ value: String(b.id), label: b.name }))}
          placeholder={t("bots.allBuildings")}
          clearable
        />

        <Button onClick={save} loading={busy} disabled={!label || !chatId}>
          {t("bots.addTarget")}
        </Button>
      </Stack>
    </Modal>
  );
}
