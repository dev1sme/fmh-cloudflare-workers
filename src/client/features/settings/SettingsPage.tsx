import { Button, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Building } from "../../../shared/types";
import { PageState } from "../../components/PageState";
import { useConfirm } from "../../hooks/useConfirm";
import { BotsSection } from "./components/BotsSection";
import { BuildingForm } from "./components/BuildingForm";
import { BuildingModal } from "./components/BuildingModal";
import { useDanhSachBot, useThaoTacBot } from "./useBots";
import { useDanhSachNha, useThaoTacNha } from "./useSettings";

export function SettingsPage() {
  const { nha, loading, error, reload } = useDanhSachNha();
  const { them, luu, xoa } = useThaoTacNha(reload);
  const bot = useDanhSachBot();
  const thaoTacBot = useThaoTacBot(bot.reload);
  const { xacNhan, hopThoai } = useConfirm();
  const { t } = useTranslation();

  const [dangThem, setDangThem] = useState(false);

  function hoiXoa(item: Building) {
    xacNhan({
      title: t("settings.deleteBuilding"),
      message: t("settings.confirmDeleteBuilding", { name: item.name }),
      confirmLabel: t("common.delete"),
      onConfirm: () => xoa(item.id),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{t("nav.settings")}</Title>
        <Button
          onClick={() => setDangThem(true)}
          leftSection={<IconPlus size={16} stroke={1.8} />}
        >
          {t("settings.addBuilding")}
        </Button>
      </Group>

      <Text c="dimmed" size="sm">
        {t("settings.ratesNote")}
      </Text>

      <PageState loading={loading} error={error}>
        <Stack>
          {nha.map((item) => (
            <BuildingForm key={item.id} nha={item} onSave={luu} onDelete={hoiXoa} />
          ))}
        </Stack>
      </PageState>

      <Divider my="md" />

      <BotsSection
        bots={bot.bots}
        buildings={nha}
        loading={bot.loading}
        error={bot.error}
        onAddBot={thaoTacBot.themBot}
        onToggleBot={(item, active) => void thaoTacBot.luuBot(item.code, { active })}
        onReplaceToken={thaoTacBot.doiToken}
        onDeleteBot={thaoTacBot.xoaBot}
        onAddTarget={thaoTacBot.themDich}
        onSaveTarget={thaoTacBot.luuDich}
        onTestTarget={thaoTacBot.guiThu}
        onDeleteTarget={thaoTacBot.xoaDich}
      />

      <BuildingModal opened={dangThem} onClose={() => setDangThem(false)} onSubmit={them} />
      {hopThoai}
    </Stack>
  );
}
