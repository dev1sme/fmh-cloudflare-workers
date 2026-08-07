import { Menu, UnstyledButton, Group, Text } from "@mantine/core";
import { IconCheck, IconLanguage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import { NGON_NGU } from "../i18n";

/**
 * The two language options, ready to drop inside an existing `Menu.Dropdown`.
 *
 * Exported separately from the standalone control below because the shells
 * already have an account menu — a second dropdown next to it for two options
 * would be a whole control for a setting most people touch once.
 */
export function LanguageMenuItems() {
  const { t, i18n } = useTranslation();
  const dangDung = i18n.resolvedLanguage ?? "vi";

  return (
    <>
      <Menu.Label>{t("common.language")}</Menu.Label>
      {NGON_NGU.map((ngon) => (
        <Menu.Item
          key={ngon.value}
          onClick={() => void i18n.changeLanguage(ngon.value)}
          leftSection={
            ngon.value === dangDung ? (
              <IconCheck size={16} stroke={2} />
            ) : (
              <span style={{ display: "inline-block", width: 16 }} />
            )
          }
        >
          {ngon.label}
        </Menu.Item>
      ))}
    </>
  );
}

/**
 * Standalone switcher for the login screen, where there is no account menu to
 * hang the options off yet. Someone who cannot read the sign-in form is
 * exactly the person who needs this, so it has to be reachable before auth.
 */
export function LanguageMenu() {
  const { i18n } = useTranslation();
  const dangDung = NGON_NGU.find((n) => n.value === (i18n.resolvedLanguage ?? "vi"));

  return (
    <Menu position="bottom-end" shadow="md" width={170}>
      <Menu.Target>
        <UnstyledButton className="fmh-account" px="xs" py={4}>
          <Group gap={6} wrap="nowrap">
            <IconLanguage size={17} stroke={1.7} />
            <Text size="sm">{dangDung?.label}</Text>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <LanguageMenuItems />
      </Menu.Dropdown>
    </Menu>
  );
}
