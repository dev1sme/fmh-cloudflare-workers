import { MantineProvider, mergeThemeOverrides } from "@mantine/core";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cssVariablesResolver, theme } from "../theme";

/**
 * `MantineProvider` with the few strings Mantine renders itself translated.
 *
 * `PasswordInput`'s visibility toggle ships the English label "Toggle password
 * visibility", which a screen reader read out in the middle of an otherwise
 * Vietnamese form. It is set here once, as a default prop, rather than at each
 * of the seven call sites that would each have to remember it.
 *
 * The theme is rebuilt when the language changes, which happens from a menu,
 * not on any path that renders often.
 */
export function LocalizedMantineProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  const localized = useMemo(
    () =>
      mergeThemeOverrides(theme, {
        components: {
          PasswordInput: {
            defaultProps: {
              visibilityToggleButtonProps: { "aria-label": t("common.togglePassword") },
            },
          },
        },
      }),
    [t],
  );

  return (
    <MantineProvider
      theme={localized}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="auto"
    >
      {children}
    </MantineProvider>
  );
}
