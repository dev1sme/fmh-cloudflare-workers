import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Switch,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconKey, IconPlus, IconSend, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { BotTarget, BotWithTargets, Building } from "../../../../shared/types";

/**
 * One bot and everywhere it sends.
 *
 * The token is never shown — there is no endpoint that returns it. `has_token`
 * is all the UI gets, and all it needs: either a token is on file or the bot
 * cannot send, and a forgotten one is replaced rather than looked up.
 */
export function BotCard({
  bot,
  buildings,
  onToggle,
  onReplaceToken,
  onDelete,
  onAddTarget,
  onToggleTarget,
  onTestTarget,
  onDeleteTarget,
}: {
  bot: BotWithTargets;
  buildings: Building[];
  onToggle: (bot: BotWithTargets, active: boolean) => void;
  onReplaceToken: (bot: BotWithTargets) => void;
  onDelete: (bot: BotWithTargets) => void;
  onAddTarget: (bot: BotWithTargets) => void;
  onToggleTarget: (target: BotTarget, active: boolean) => void;
  onTestTarget: (target: BotTarget) => void;
  onDeleteTarget: (target: BotTarget) => void;
}) {
  const { t } = useTranslation();
  const [testing, setTesting] = useState<string | null>(null);

  const buildingName = (id: number | null) =>
    id === null ? t("bots.allBuildings") : (buildings.find((b) => b.id === id)?.name ?? `#${id}`);

  async function sendTest(target: BotTarget) {
    setTesting(target.code);
    await onTestTarget(target);
    setTesting(null);
  }

  return (
    <Card withBorder padding="md">
      <Stack>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Text fw={600}>{bot.name}</Text>
            <Badge variant="light" size="sm">
              {bot.platform}
            </Badge>
            {!bot.has_token && (
              <Badge variant="light" color="owed" size="sm">
                {t("bots.noToken")}
              </Badge>
            )}
          </Group>

          <Switch
            checked={bot.active}
            onChange={(e) => onToggle(bot, e.currentTarget.checked)}
            label={t("bots.active")}
            labelPosition="left"
          />
        </Group>

        {bot.targets.length === 0 ? (
          <Text c="dimmed" size="sm">
            {t("bots.noTargets")}
          </Text>
        ) : (
          <Table withRowBorders={false} verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("bots.label")}</Table.Th>
                <Table.Th>{t("bots.kind")}</Table.Th>
                <Table.Th>{t("bots.building")}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {bot.targets.map((target) => (
                <Table.Tr key={target.code} opacity={target.active ? 1 : 0.5}>
                  <Table.Td>
                    <Text size="sm">{target.label}</Text>
                    <Text size="xs" c="dimmed">
                      {target.chat_id}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {/* Amber for MANAGER: that target is sent amounts. */}
                    <Badge
                      variant="light"
                      size="sm"
                      color={target.kind === "MANAGER" ? "owed" : "gray"}
                    >
                      {t(target.kind === "MANAGER" ? "bots.kindManager" : "bots.kindGroup")}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{buildingName(target.building_id)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                      <Switch
                        checked={target.active}
                        onChange={(e) => onToggleTarget(target, e.currentTarget.checked)}
                        size="sm"
                        aria-label={t("bots.active")}
                      />
                      <Tooltip label={t("bots.test")}>
                        <ActionIcon
                          variant="subtle"
                          onClick={() => void sendTest(target)}
                          loading={testing === target.code}
                          aria-label={t("bots.test")}
                        >
                          <IconSend size={16} stroke={1.8} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t("bots.deleteTarget")}>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => onDeleteTarget(target)}
                          aria-label={t("bots.deleteTarget")}
                        >
                          <IconTrash size={16} stroke={1.8} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        <Group justify="space-between">
          <Group gap="xs">
            <Button
              variant="light"
              size="xs"
              leftSection={<IconPlus size={14} stroke={1.8} />}
              onClick={() => onAddTarget(bot)}
            >
              {t("bots.addTarget")}
            </Button>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconKey size={14} stroke={1.8} />}
              onClick={() => onReplaceToken(bot)}
            >
              {t("bots.replaceToken")}
            </Button>
          </Group>

          {/* Refused by the API while the bot still has destinations. */}
          <Button variant="subtle" size="xs" color="red" onClick={() => onDelete(bot)}>
            {t("bots.delete")}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
