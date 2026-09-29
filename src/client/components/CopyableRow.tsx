import { ActionIcon, CopyButton, Group, Text, Tooltip } from "@mantine/core";
import { useTranslation } from "react-i18next";

/** Two overlapping sheets. Inline so the app takes no icon dependency. */
function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * One line of payment detail with a copy button.
 *
 * `value` is what lands on the clipboard and `display` is what the tenant
 * reads — they differ for money, where the screen wants `2.415.000 đ` but a
 * banking app wants `2415000`. Pasting the formatted string transfers the
 * wrong amount or is rejected outright, so the two must stay separate.
 *
 * The button is a real, visible control rather than a click handler on the
 * text: a `title` tooltip does not exist on a phone, which is where a tenant
 * actually pays from.
 */
export function CopyableRow({
  label,
  value,
  display,
}: {
  label: string;
  value: string;
  display?: string;
}) {
  const { t } = useTranslation();
  const copyLabel = t("common.copy", { what: label.toLowerCase() });

  return (
    <Group justify="space-between" gap="md" wrap="nowrap">
      <Text size="sm" c="dimmed">
        {label}
      </Text>

      <Group gap={6} wrap="nowrap">
        <Text size="sm" fw={500} ta="right">
          {display ?? value}
        </Text>

        <CopyButton value={value} timeout={1500}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? t("common.copied") : copyLabel} withArrow>
              <ActionIcon
                variant={copied ? "filled" : "light"}
                color={copied ? "teal" : "gray"}
                size="sm"
                onClick={copy}
                aria-label={copyLabel}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </Group>
  );
}
