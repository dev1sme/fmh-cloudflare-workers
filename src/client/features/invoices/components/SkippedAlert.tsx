import { Alert, List } from "@mantine/core";

import type { GenerateResult } from "../../../../shared/types";

const LY_DO: Record<GenerateResult["skipped"][number]["reason"], string> = {
  MISSING_READING: "chưa nhập chỉ số",
  ALREADY_INVOICED: "đã có hóa đơn",
};

/** Rooms that generation deliberately passed over, so nothing looks missing. */
export function SkippedAlert({
  skipped,
  onClose,
}: {
  skipped: GenerateResult["skipped"];
  onClose: () => void;
}) {
  if (skipped.length === 0) return null;

  return (
    <Alert color="yellow" title="Một số phòng chưa sinh được" withCloseButton onClose={onClose}>
      <List size="sm">
        {skipped.map((item) => (
          <List.Item key={item.room_id}>
            {item.room_name} — {LY_DO[item.reason]}
          </List.Item>
        ))}
      </List>
    </Alert>
  );
}
