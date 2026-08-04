import { Alert, Center, Loader } from "@mantine/core";
import type { ReactNode } from "react";

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
  if (error) {
    return (
      <Alert color="red" title="Không tải được dữ liệu">
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
