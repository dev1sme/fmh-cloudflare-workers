import { Group, Menu, Text, UnstyledButton, useMantineColorScheme } from "@mantine/core";
import { IconDeviceLaptop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import { LANGUAGES } from "../i18n";
import { LanguageMenuItems } from "./LanguageMenu";
import { ThemeMenuItems } from "./ThemeMenu";

const ICONS = {
  light: IconSun,
  dark: IconMoon,
  auto: IconDeviceLaptop,
} as const;

/**
 * Language and appearance in one control, for the login screen — the one place
 * with no account menu to hang them off, and the place someone who cannot read
 * the form has to be able to reach.
 *
 * The icon shows the *appearance* setting and the label shows the language, so
 * the closed button states both of the things behind it. It reads the chosen
 * value rather than the resolved one, so "follow the system" shows as itself
 * instead of silently looking like whichever scheme the system happens to be
 * on — otherwise there is no way to tell a deliberate Dark from a system that
 * is merely dark right now.
 */
export function PreferencesMenu() {
  const { i18n } = useTranslation();
  const { colorScheme } = useMantineColorScheme();

  const language = LANGUAGES.find((n) => n.value === (i18n.resolvedLanguage ?? "vi"));
  const Icon = ICONS[colorScheme];

  return (
    <Menu position="bottom-end" shadow="md" width={190}>
      <Menu.Target>
        <UnstyledButton className="fmh-account" px="xs" py="xs">
          <Group gap={6} wrap="nowrap">
            <Icon size={17} stroke={1.7} />
            <Text size="sm">{language?.label}</Text>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <ThemeMenuItems />

        <Menu.Divider />
        <LanguageMenuItems />
      </Menu.Dropdown>
    </Menu>
  );
}
