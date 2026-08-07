import { Alert, Center, Loader } from "@mantine/core";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { thongBaoLoi } from "../errors";

/** Renders children only once data has arrived; shows a spinner or the error. */
export function PageState({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error: unknown;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  if (error) {
    return (
      <Alert color="red" title={t("common.loadFailed")}>
        {thongBaoLoi(error)}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  return <>{children}</>;
}
