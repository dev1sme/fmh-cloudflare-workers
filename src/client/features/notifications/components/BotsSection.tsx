import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconPlus, IconRobot } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { BotTarget, BotWithTargets, Building } from "../../../../shared/types";
import type { BotInput, BotTargetInput } from "../../../api";
import { EmptyState } from "../../../components/EmptyState";
import { PageState } from "../../../components/PageState";
import { useConfirm } from "../../../hooks/useConfirm";
import { BotCard } from "./BotCard";
import { BotModal } from "./BotModal";
import { TargetModal } from "./TargetModal";

/**
 * The Zalo notification block — everything `NotificationsPage` renders.
 *
 * Kept as its own component rather than inlined into the page: it owns three
 * modals' worth of local state (add bot, replace token, add target) that a
 * page component should not be carrying directly. Takes callbacks and never
 * touches `api.ts` — the mutations belong to `useBots`.
 */
export function BotsSection({
  bots,
  buildings,
  loading,
  refreshing,
  error,
  onRetry,
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
  refreshing: boolean;
  error: unknown;
  onRetry: () => void;
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
  const { confirm, confirmDialog } = useConfirm();

  const [addingBot, setAddingBot] = useState(false);
  const [tokenFor, setTokenFor] = useState<BotWithTargets | null>(null);
  const [addTargetFor, setAddTargetFor] = useState<BotWithTargets | null>(null);

  function askDeleteBot(bot: BotWithTargets) {
    confirm({
      title: t("bots.delete"),
      message: t("bots.confirmDelete", { name: bot.name }),
      confirmLabel: t("common.delete"),
      onConfirm: () => onDeleteBot(bot.code),
    });
  }

  function askDeleteTarget(target: BotTarget) {
    confirm({
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
          onClick={() => setAddingBot(true)}
          leftSection={<IconPlus size={16} stroke={1.8} />}
        >
          {t("bots.add")}
        </Button>
      </Group>

      <Text c="dimmed" size="sm">
        {t("bots.note")}
      </Text>

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={onRetry}>
        <Stack>
          {bots.length === 0 ? (
            <EmptyState
              icon={<IconRobot size={24} stroke={1.6} />}
              title={t("bots.empty")}
              hint={t("bots.emptyHint")}
            />
          ) : (
            bots.map((bot) => (
              <BotCard
                key={bot.code}
                bot={bot}
                buildings={buildings}
                onToggle={onToggleBot}
                onReplaceToken={setTokenFor}
                onDelete={askDeleteBot}
                onAddTarget={setAddTargetFor}
                onToggleTarget={(target, active) => void onSaveTarget(target.code, { active })}
                onTestTarget={(target) => void onTestTarget(target.code)}
                onDeleteTarget={askDeleteTarget}
              />
            ))
          )}
        </Stack>
      </PageState>

      <BotModal
        opened={addingBot}
        onClose={() => setAddingBot(false)}
        onSubmit={onAddBot}
      />

      {/* Same modal, name locked: replacing a token asks for nothing else. */}
      <BotModal
        opened={tokenFor !== null}
        onClose={() => setTokenFor(null)}
        tokenOnly={tokenFor ? { name: tokenFor.name } : undefined}
        onSubmit={({ token }) =>
          tokenFor ? onReplaceToken(tokenFor.code, token) : Promise.resolve(false)
        }
      />

      <TargetModal
        opened={addTargetFor !== null}
        onClose={() => setAddTargetFor(null)}
        buildings={buildings}
        onSubmit={(input) =>
          addTargetFor ? onAddTarget(addTargetFor.code, input) : Promise.resolve(false)
        }
      />

      {confirmDialog}
    </Stack>
  );
}
