import { PageHeader } from "#/components/ds/app-shell";
import type { AdminRoomManagementResources } from "#/server/api/haxfootball";
import { AdminRoomsTable } from "./components/admin-rooms-table";
import { LaunchRoomCard } from "./components/launch-room-card";

export { readLaunchConfig } from "./utils/launch-config";

export function AdminRoomsPage({ resources }: { resources: AdminRoomManagementResources }) {
  return (
    <>
      <PageHeader
        title="Salas"
        description="Lançamento, fechamento e acompanhamento operacional das salas."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <LaunchRoomCard resources={resources} />
        <AdminRoomsTable rooms={resources.rooms.items} />
      </div>
    </>
  );
}
