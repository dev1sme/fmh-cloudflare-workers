import { Alert, Button, Modal, PasswordInput, Stack, TextInput } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { BotInput } from "../../../api";

/**
 * Creating a bot, or replacing an existing one's token.
 *
 * `PasswordInput` for the token, not `TextInput`: the manager pastes this from
 * Zalo's dashboard, often on a shared screen, and it is the one credential in
 * this app that can post as the bot into the tenants' group.
 */
export function BotModal({
  opened,
  onClose,
  onSubmit,
  /** Set when replacing a token — the name is fixed and only the token is asked for. */
  tokenOnly,
}: {
  opened: boolean;
  onClose: () => void;
  onSubmit: (input: BotInput) => Promise<boolean>;
  tokenOnly?: { name: string };
}) {
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!opened) return;
    setName(tokenOnly?.name ?? "");
    setToken("");
  }, [opened, tokenOnly]);

  async function save() {
    setBusy(true);
    const ok = await onSubmit({ name, token, platform: "ZALO" });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={tokenOnly ? t("bots.replaceToken") : t("bots.add")}
    >
      <Stack>
        {!tokenOnly && (
          <TextInput
            label={t("bots.name")}
            placeholder="Bot Júp Việc"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />
        )}

        <PasswordInput
          label={t("bots.token")}
          description={t("bots.tokenHint")}
          value={token}
          onChange={(e) => setToken(e.currentTarget.value)}
          required
        />

        <Alert variant="light" icon={<IconInfoCircle size={16} stroke={1.8} />}>
          {t("bots.tokenWriteOnly")}
        </Alert>

        <Button onClick={save} loading={busy} disabled={!token || (!tokenOnly && !name)}>
          {tokenOnly ? t("bots.replaceToken") : t("bots.add")}
        </Button>
      </Stack>
    </Modal>
  );
}
