import { Stack, Text, Title } from "@mantine/core";

import { PageState } from "../../components/PageState";
import { ReadingsHistoryTable } from "./components/ReadingsHistoryTable";
import { useChiSoCuaToi } from "./useCuaToi";

export function MyReadingsPage() {
  const { chiSo, loading, error } = useChiSoCuaToi();

  return (
    <Stack>
      <Title order={3}>Lịch sử chỉ số</Title>

      <PageState loading={loading} error={error}>
        {chiSo.length === 0 ? (
          <Text c="dimmed">Chưa có chỉ số nào được ghi.</Text>
        ) : (
          <ReadingsHistoryTable chiSo={chiSo} />
        )}
      </PageState>
    </Stack>
  );
}
