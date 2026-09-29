import { Menu } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import { LANGUAGES } from "../i18n";

/**
 * The two language options, ready to drop inside an existing `Menu.Dropdown`.
 *
 * Both shells already have an account menu, so these go inside it rather than
 * earning a control of their own — two options is not worth a button in the
 * chrome. `PreferencesMenu` wraps these for the login screen, which has no
 * account menu to use.
 */
export function LanguageMenuItems() {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? "vi";

  return (
    <>
      <Menu.Label>{t("common.language")}</Menu.Label>
      {LANGUAGES.map((lang) => (
        <Menu.Item
          key={lang.value}
          onClick={() => void i18n.changeLanguage(lang.value)}
          leftSection={
            lang.value === current ? (
              <IconCheck size={16} stroke={2} />
            ) : (
              <span style={{ display: "inline-block", width: 16 }} />
            )
          }
        >
          {lang.label}
        </Menu.Item>
      ))}
    </>
  );
}
