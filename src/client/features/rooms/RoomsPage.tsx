import { Box, Button, Group, Stack, Title, Tooltip } from "@mantine/core";
import { IconBuildingCommunity, IconHome, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { RoomDetail } from "../../../shared/types";
import { EmptyState } from "../../components/EmptyState";
import { PageState } from "../../components/PageState";
import { useConfirm } from "../../hooks/useConfirm";
import { Link } from "react-router-dom";
import { MoveInModal } from "./components/MoveInModal";
import { RoomModal, type RoomTarget } from "./components/RoomModal";
import { RoomCards } from "./components/RoomCards";
import { RoomsTable } from "./components/RoomsTable";
import { useRoomList, useRoomActions } from "./useRooms";

export function RoomsPage() {
  const { rooms, buildings, loading, refreshing, error, reload } = useRoomList();
  const { addRoom, updateRoom, removeRoom, moveIn, moveOut } = useRoomActions(reload);
  const { confirm, confirmDialog } = useConfirm();
  const { t } = useTranslation();

  const [movingOut, setMovingOut] = useState<RoomTarget>(null);
  const [movingIn, setMovingIn] = useState<RoomDetail | null>(null);

  function askMoveOut(room: RoomDetail) {
    if (!room.tenant) return;

    confirm({
      title: t("rooms.confirmMoveOutTitle"),
      message: t("rooms.confirmMoveOut", {
        name: room.tenant.full_name,
        room: room.room_name,
      }),
      confirmLabel: t("rooms.movedOutLabel"),
      color: "orange",
      onConfirm: () => moveOut(room.tenant!.code),
    });
  }

  function askDeleteRoom(room: RoomDetail) {
    confirm({
      title: t("rooms.delete"),
      message: t("rooms.confirmDelete", { room: room.room_name }),
      confirmLabel: t("common.delete"),
      onConfirm: () => removeRoom(room.code),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{t("nav.rooms")}</Title>
        {/* Disabled needs a reason attached to it. A room belongs to a
            building, and on a fresh install this button is grey with nothing
            on the screen saying why or where to go. A Tooltip alone would not
            do it — Mantine strips pointer events from a disabled button, so it
            never fires — hence the wrapping span. */}
        <Tooltip label={t("rooms.needBuilding")} disabled={buildings.length > 0} withArrow>
          <span>
            <Button
              onClick={() => setMovingOut({ room: null })}
              disabled={buildings.length === 0}
              leftSection={<IconPlus size={16} stroke={1.8} />}
            >
              {t("rooms.add")}
            </Button>
          </span>
        </Tooltip>
      </Group>

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {rooms.length === 0 ? (
          // Two different dead ends, two different answers. With no building
          // there is nothing to do on this screen at all, so the way out points
          // at Nhà; with a building, the room is one click away.
          buildings.length === 0 ? (
            <EmptyState
              icon={<IconBuildingCommunity size={24} stroke={1.6} />}
              title={t("rooms.noBuilding")}
              hint={t("rooms.noBuildingHint")}
              action={
                <Button component={Link} to="/buildings" variant="light">
                  {t("nav.buildings")}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<IconHome size={24} stroke={1.6} />}
              title={t("rooms.empty")}
              hint={t("rooms.emptyHint")}
              action={
                <Button
                  onClick={() => setMovingOut({ room: null })}
                  leftSection={<IconPlus size={16} stroke={1.8} />}
                >
                  {t("rooms.add")}
                </Button>
              }
            />
          )
        ) : (
          <>
            {/* Six columns at minWidth 720 do not fit a phone; the cards below
                `sm` carry the same facts. */}
            <Box visibleFrom="sm">
              <RoomsTable
                rooms={rooms}
                onEdit={(room) => setMovingOut({ room })}
                onMoveIn={setMovingIn}
                onMoveOut={askMoveOut}
                onDelete={askDeleteRoom}
              />
            </Box>
            <Box hiddenFrom="sm">
              <RoomCards
                rooms={rooms}
                onEdit={(room) => setMovingOut({ room })}
                onMoveIn={setMovingIn}
                onMoveOut={askMoveOut}
                onDelete={askDeleteRoom}
              />
            </Box>
          </>
        )}
      </PageState>

      <RoomModal
        target={movingOut}
        buildings={buildings}
        onClose={() => setMovingOut(null)}
        onCreate={addRoom}
        onUpdate={updateRoom}
      />
      <MoveInModal
        room={movingIn}
        onClose={() => setMovingIn(null)}
        onSubmit={moveIn}
      />
      {confirmDialog}
    </Stack>
  );
}
