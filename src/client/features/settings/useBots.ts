import {
  botTargets as botTargetsApi,
  bots as botsApi,
  type BotInput,
  type BotTargetInput,
} from "../../api";
import { baoLoi, baoThanhCong } from "../../errors";
import i18n from "../../i18n";
import { useResource } from "../../hooks/useResource";

export function useDanhSachBot() {
  const { data, loading, error, reload } = useResource(() => botsApi.list());
  return { bots: data?.bots ?? [], loading, error, reload };
}

/**
 * Mutations for bots and their destinations.
 *
 * Every one returns `Promise<boolean>` and raises its own toast, so the calling
 * page only has to decide whether to close a modal — the convention the rest of
 * the features follow.
 */
export function useThaoTacBot(reload: () => void) {
  async function chay(viec: () => Promise<unknown>, thongBao: string): Promise<boolean> {
    try {
      await viec();
      baoThanhCong(thongBao);
      reload();
      return true;
    } catch (err) {
      baoLoi(err);
      return false;
    }
  }

  return {
    themBot: (input: BotInput) => chay(() => botsApi.create(input), i18n.t("bots.added")),

    luuBot: (code: string, patch: { name?: string; active?: boolean }) =>
      chay(() => botsApi.update(code, patch), i18n.t("bots.saved")),

    /** Replaces the token. The old one is not readable, here or anywhere. */
    doiToken: (code: string, token: string) =>
      chay(() => botsApi.setToken(code, token), i18n.t("bots.tokenReplaced")),

    /** Rejected by the API while the bot still has destinations. */
    xoaBot: (code: string) => chay(() => botsApi.remove(code), i18n.t("bots.deleted")),

    themDich: (botCode: string, input: BotTargetInput) =>
      chay(() => botsApi.addTarget(botCode, input), i18n.t("bots.targetAdded")),

    luuDich: (code: string, patch: { label?: string; chat_id?: string; active?: boolean }) =>
      chay(() => botTargetsApi.update(code, patch), i18n.t("bots.targetSaved")),

    xoaDich: (code: string) => chay(() => botTargetsApi.remove(code), i18n.t("bots.targetDeleted")),

    /**
     * Sends a real message. Unlike everything else, the server waits for Zalo
     * here and reports the failure, so the toast reflects an actual delivery
     * rather than a queued attempt.
     */
    guiThu: (code: string) => chay(() => botTargetsApi.test(code), i18n.t("bots.testSent")),
  };
}
