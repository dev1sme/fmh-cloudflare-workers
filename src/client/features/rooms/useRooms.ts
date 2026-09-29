import {
  buildings as buildingsApi,
  rooms as roomsApi,
  tenants as tenantsApi,
  type RoomInput,
} from "../../api";
import { toastError, toastSuccess } from "../../errors";
import i18n from "../../i18n";
import { today } from "../../format";
import { useResource } from "../../hooks/useResource";

export function useRoomList() {
  const rooms = useResource(() => roomsApi.list(), []);
  const buildings = useResource(() => buildingsApi.list(), []);

  return {
    rooms: rooms.data?.rooms ?? [],
    // Needed to pick a building when adding a room.
    buildings: buildings.data?.buildings ?? [],
    loading: rooms.loading || buildings.loading,
    refreshing: rooms.refreshing || buildings.refreshing,
    error: rooms.error ?? buildings.error,
    // Both, not just the rooms. `error` surfaces whichever request failed, so a
    // retry that re-ran only one of them would leave the buildings error on
    // screen with a button that does nothing about it.
    reload: () => {
      rooms.reload();
      buildings.reload();
    },
  };
}

export type NewTenant = {
  full_name: string;
  phone: string;
  occupants: number;
  moved_in: string;
};

/**
 * Mutations for the rooms screen. Each returns whether it succeeded so the
 * caller can close its modal, and reports its own success/error toast.
 */
export function useRoomActions(reload: () => void) {
  async function addRoom(input: RoomInput): Promise<boolean> {
    try {
      await roomsApi.create(input);
      toastSuccess(i18n.t("rooms.added"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function updateRoom(code: string, patch: Partial<RoomInput>): Promise<boolean> {
    try {
      await roomsApi.update(code, patch);
      toastSuccess(i18n.t("rooms.saved"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  /** Rejected by the API while readings, invoices or tenants reference the room. */
  async function removeRoom(code: string): Promise<boolean> {
    try {
      await roomsApi.remove(code);
      toastSuccess(i18n.t("rooms.deleted"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function moveIn(roomId: number, input: NewTenant): Promise<boolean> {
    try {
      await tenantsApi.create({
        room_id: roomId,
        full_name: input.full_name,
        phone: input.phone || null,
        occupants: input.occupants,
        moved_in: input.moved_in,
      });
      toastSuccess(i18n.t("tenantForm.added"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  async function moveOut(tenantCode: string): Promise<boolean> {
    try {
      await tenantsApi.update(tenantCode, { moved_out: today() });
      toastSuccess(i18n.t("tenantForm.movedOutDone"));
      reload();
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  }

  return { addRoom, updateRoom, removeRoom, moveIn, moveOut };
}
