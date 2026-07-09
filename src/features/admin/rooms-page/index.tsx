import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { PageHeader } from "#/components/ds/app-shell/page-header";
import type { AdminRoomManagementResources } from "#/server/api/haxfootball";
import { AdminRoomsTable } from "./components/admin-rooms-table";
import { LaunchRoomDialog } from "./components/launch-room-dialog";

export { readLaunchConfig } from "./utils/launch-config";

export function AdminRoomsPage({ resources }: { resources: AdminRoomManagementResources }) {
  useProvisioningRoomsRefresh(resources);

  return (
    <>
      <PageHeader
        title="Salas"
        description="Lançamento, fechamento e acompanhamento operacional das salas."
        action={<LaunchRoomDialog resources={resources} />}
      />

      <div className="grid items-start gap-6">
        <AdminRoomsTable rooms={resources.rooms.items} history={resources.roomHistory} />
      </div>
    </>
  );
}

function useProvisioningRoomsRefresh(resources: AdminRoomManagementResources) {
  const router = useRouter();
  const hasProvisioningRoom = resources.rooms.items.some((room) => room.state === "provisioning");

  useEffect(() => {
    if (!hasProvisioningRoom) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void router.invalidate();
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [hasProvisioningRoom, router]);
}
