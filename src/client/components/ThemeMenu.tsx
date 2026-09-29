import { Menu, useMantineColorScheme, type MantineColorScheme } from "@mantine/core";
import { IconCheck, IconDeviceLaptop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

const OPTIONS = [
  { value: "light", key: "theme.light", icon: IconSun },
  { value: "dark", key: "theme.dark", icon: IconMoon },
  { value: "auto", key: "theme.system", icon: IconDeviceLaptop },
] as const satisfies ReadonlyArray<{
  value: MantineColorScheme;
  key: string;
  icon: typeof IconSun;
}>;

/**
 * Light / dark / follow the system, ready to drop inside an existing
 * `Menu.Dropdown` — same shape as `LanguageMenuItems`, and for the same
 * reason: these are settings someone touches once, not controls that deserve
 * their own button in the chrome.
 *
 * "Follow the system" is a real third option rather than a toggle between two.
 * A tenant opening this on a phone at night has already told their phone they
 * want dark, and a two-way toggle would make them say it again here.
 *
 * Mantine persists the choice itself, under `mantine-color-scheme-value`; the
 * inline script in `index.html` reads that key before first paint so an
 * explicit choice does not flash the other scheme on the way in.
 */
export function ThemeMenuItems() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <>
      <Menu.Label>{t("theme.label")}</Menu.Label>
      {OPTIONS.map((item) => {
        const Icon = item.icon;

        return (
          <Menu.Item
            key={item.value}
            onClick={() => setColorScheme(item.value)}
            leftSection={<Icon size={16} stroke={1.8} />}
            rightSection={
              item.value === colorScheme ? <IconCheck size={14} stroke={2.2} /> : null
            }
          >
            {t(item.key)}
          </Menu.Item>
        );
      })}
    </>
  );
}
