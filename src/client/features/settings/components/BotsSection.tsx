import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { BotTarget, BotWithTargets, Building } from "../../../../shared/types";
import type { BotInput, BotTargetInput } from "../../../api";
import { PageState } from "../../../components/PageState";
import { useConfirm } from "../../../hooks/useConfirm";
import { BotCard } from "./BotCard";
import { BotModal } from "./BotModal";
import { TargetModal } from "./TargetModal";

/**
 * The Zalo notification block on the settings screen.
 *
 * A section rather than more code in `SettingsPage`: buildings and bots share a
 * screen but nothing else, and the page was already the size where the next
 * feature would have made it the file everything lives in. Takes callbacks and
 * never touches `api.ts` — the mutations belong to `useBots`.
 */
export function BotsSection({
  bots,
  buildings,
  loading,
  error,
  onAddBot,
  onToggleBot,
  onReplaceToken,
  onDeleteBot,
  onAddTarget,
  onSaveTarget,
  onTestTarget,
  onDeleteTarget,
}: {
  bots: BotWithTargets[];
  buildings: Building[];
  loading: boolean;
  error: unknown;
  onAddBot: (input: BotInput) => Promise<boolean>;
  onToggleBot: (bot: BotWithTargets, active: boolean) => void;
  onReplaceToken: (code: string, token: string) => Promise<boolean>;
  onDeleteBot: (code: string) => Promise<boolean>;
  onAddTarget: (botCode: string, input: BotTargetInput) => Promise<boolean>;
  onSaveTarget: (code: string, patch: { active?: boolean }) => Promise<boolean>;
  onTestTarget: (code: string) => Promise<boolean>;
  onDeleteTarget: (code: string) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const { xacNhan, hopThoai } = useConfirm();

  const [dangThemBot, setDangThemBot] = useState(false);
  const [doiTokenCho, setDoiTokenCho] = useState<BotWithTargets | null>(null);
  const [themDichCho, setThemDichCho] = useState<BotWithTargets | null>(null);

  function hoiXoaBot(bot: BotWithTargets) {
    xacNhan({
      title: t("bots.delete"),
      message: t("bots.confirmDelete", { name: bot.name }),
      confirmLabel: t("common.delete"),
      onConfirm: () => onDeleteBot(bot.code),
    });
  }

  function hoiXoaDich(target: BotTarget) {
    xacNhan({
      title: t("bots.deleteTarget"),
      message: t("bots.confirmDeleteTarget", { label: target.label }),
      confirmLabel: t("common.delete"),
      onConfirm: () => onDeleteTarget(target.code),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>{t("bots.title")}</Title>
        <Button
          variant="light"
          onClick={() => setDangThemBot(true)}
          leftSection={<IconPlus size={16} stroke={1.8} />}
        >
          {t("bots.add")}
        </Button>
      </Group>

      <Text c="dimmed" size="sm">
        {t("bots.note")}
      </Text>

      <PageState loading={loading} error={error}>
        <Stack>
          {bots.length === 0 ? (
            <Text c="dimmed" size="sm">
              {t("bots.empty")}
            </Text>
          ) : (
            bots.map((bot) => (
              <BotCard
                key={bot.code}
                bot={bot}
                buildings={buildings}
                onToggle={onToggleBot}
                onReplaceToken={setDoiTokenCho}
                onDelete={hoiXoaBot}
                onAddTarget={setThemDichCho}
                onToggleTarget={(target, active) => void onSaveTarget(target.code, { active })}
                onTestTarget={(target) => void onTestTarget(target.code)}
                onDeleteTarget={hoiXoaDich}
              />
            ))
          )}
        </Stack>
      </PageState>

      <BotModal
        opened={dangThemBot}
        onClose={() => setDangThemBot(false)}
        onSubmit={onAddBot}
      />

      {/* Same modal, name locked: replacing a token asks for nothing else. */}
      <BotModal
        opened={doiTokenCho !== null}
        onClose={() => setDoiTokenCho(null)}
        tokenOnly={doiTokenCho ? { name: doiTokenCho.name } : undefined}
        onSubmit={({ token }) =>
          doiTokenCho ? onReplaceToken(doiTokenCho.code, token) : Promise.resolve(false)
        }
      />

      <TargetModal
        opened={themDichCho !== null}
        onClose={() => setThemDichCho(null)}
        buildings={buildings}
        onSubmit={(input) =>
          themDichCho ? onAddTarget(themDichCho.code, input) : Promise.resolve(false)
        }
      />

      {hopThoai}
    </Stack>
  );
}
