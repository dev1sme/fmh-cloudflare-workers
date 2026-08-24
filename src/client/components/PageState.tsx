import { Alert, Box, Button, Center, Group, Loader } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { thongBaoLoi } from "../errors";

/**
 * Renders children once data has arrived, and says what is happening until then.
 *
 * Three states, deliberately not two:
 *
 * - `error` — the message plus a **retry**. Every caller already has `reload`
 *   from `useResource`, so the only way out of a dropped request used to be F5.
 * - `loading` — nothing to show yet, so a spinner is all there is.
 * - `refreshing` — the same query running again with its result still on
 *   screen. This renders a bar at the top of the viewport and leaves the
 *   content alone: it is a moment stale, not gone.
 *
 * The bar is fixed to the viewport rather than wrapped around `children`. A
 * wrapper would put a `<Box>` between each page's `<Stack>` and its rows, which
 * silently drops the Stack's `gap` for every screen at once — a layout change
 * to twelve pages in exchange for a spinner nobody asked to move.
 */
export function PageState({
  loading,
  refreshing,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  refreshing?: boolean;
  error: unknown;
  /** Usually `reload` from `useResource`. Omitted, the retry button is hidden. */
  onRetry?: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  if (error) {
    return (
      <Alert color="red" title={t("common.loadFailed")}>
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Box>{thongBaoLoi(error)}</Box>
          {onRetry && (
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={onRetry}
              leftSection={<IconRefresh size={14} stroke={1.8} />}
            >
              {t("common.retry")}
            </Button>
          )}
        </Group>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Center py="xl">
        <Loader aria-label={t("common.loading")} />
      </Center>
    );
  }

  return (
    <>
      {refreshing && <Box className="fmh-refreshing" aria-hidden />}
      {children}
    </>
  );
}
