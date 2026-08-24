import { Stack } from "@mantine/core";

import { useDanhSachNha } from "../buildings/useBuildings";
import { BotsSection } from "./components/BotsSection";
import { useDanhSachBot, useThaoTacBot } from "./useBots";

/**
 * Zalo notification bots and their destinations. This used to be one page
 * with the building forms below a `Divider`, called "Cài đặt" — a name that
 * described neither half of what was on it. Buildings moved to their own
 * screen (`/buildings`) because they are core billing data (the rates and the
 * bank account VietQR pays into), not a setting; this page keeps the name
 * that now actually fits what it does.
 *
 * No page-level title: `BotsSection` already renders "Thông báo Zalo" as its
 * own heading, and this page has nothing else on it — a second, near-identical
 * "Thông báo" title above it would say the same thing twice.
 *
 * `nha` is fetched here rather than passed down from a shared parent — there
 * is no shared parent any more — purely to populate the building selector on
 * a per-building notification target.
 */
export function NotificationsPage() {
  const { nha } = useDanhSachNha();
  const bot = useDanhSachBot();
  const thaoTacBot = useThaoTacBot(bot.reload);

  return (
    <Stack>
      <BotsSection
        bots={bot.bots}
        buildings={nha}
        loading={bot.loading}
        refreshing={bot.refreshing}
        onRetry={bot.reload}
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
    </Stack>
  );
}
