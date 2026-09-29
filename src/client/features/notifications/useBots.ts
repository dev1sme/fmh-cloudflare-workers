import {
  botTargets as botTargetsApi,
  bots as botsApi,
  type BotInput,
  type BotTargetInput,
} from "../../api";
import { toastError, toastSuccess } from "../../errors";
import i18n from "../../i18n";
import { useResource } from "../../hooks/useResource";

export function useBotList() {
  const { data, loading, refreshing, error, reload } = useResource(() => botsApi.list());
  return { bots: data?.bots ?? [], loading, refreshing, error, reload };
}

/**
 * Mutations for bots and their destinations.
 *
 * Every one returns `Promise<boolean>` and raises its own toast, so the calling
 * page only has to decide whether to close a modal — the convention the rest of
 * the features follow.
 */
export function useBotActions(reload: () => void) {
  async function run(task: () => Promise<unknown>, successMessage: string): Promise<boolean> {
    try {
      await task();
      toastSuccess(successMessage);
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  return {
    addBot: (input: BotInput) => run(() => botsApi.create(input), i18n.t("bots.added")),

    saveBot: (code: string, patch: { name?: string; active?: boolean }) =>
      run(() => botsApi.update(code, patch), i18n.t("bots.saved")),

    /** Replaces the token. The old one is not readable, here or anywhere. */
    replaceToken: (code: string, token: string) =>
      run(() => botsApi.setToken(code, token), i18n.t("bots.tokenReplaced")),

    /** Rejected by the API while the bot still has destinations. */
    removeBot: (code: string) => run(() => botsApi.remove(code), i18n.t("bots.deleted")),

    addTarget: (botCode: string, input: BotTargetInput) =>
      run(() => botsApi.addTarget(botCode, input), i18n.t("bots.targetAdded")),

    saveTarget: (code: string, patch: { label?: string; chat_id?: string; active?: boolean }) =>
      run(() => botTargetsApi.update(code, patch), i18n.t("bots.targetSaved")),

    removeTarget: (code: string) => run(() => botTargetsApi.remove(code), i18n.t("bots.targetDeleted")),

    /**
     * Sends a real message. Unlike everything else, the server waits for Zalo
     * here and reports the failure, so the toast reflects an actual delivery
     * rather than a queued attempt.
     */
    sendTest: (code: string) => run(() => botTargetsApi.test(code), i18n.t("bots.testSent")),
  };
}
