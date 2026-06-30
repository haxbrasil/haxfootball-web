import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AdminRoomManagementResources } from "#/server/api/haxfootball";
import type { ApiAccountSession } from "#/server/auth/session";

type PermissionedLaunchConfigField = {
  key: string;
  requiredPermission?: string;
};

const idInput = z.object({
  id: z.string().min(1),
});

const paginationInput = z
  .object({
    cursor: z.string().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .optional();

export const getAdminRoomFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const { getAdminRoom } = await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");

    await requireApiPermission("room-launch:operate");

    return getAdminRoom(data.id);
  });

export const listAdminRoomManagementResourcesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const { listAdminRoomManagementResources } = await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");
    const session = await requireApiPermission("room-launch:operate");
    const resources = await listAdminRoomManagementResources();

    return filterLaunchConfigFields(resources, session);
  },
);

export const listAdminRoomHistoryFn = createServerFn({ method: "GET" })
  .inputValidator(paginationInput)
  .handler(async ({ data }) => {
    const { listAdminRoomHistory } = await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");

    await requireApiPermission("room-launch:operate");

    return listAdminRoomHistory(data ?? {});
  });

function filterLaunchConfigFields(
  resources: AdminRoomManagementResources,
  session: ApiAccountSession,
): AdminRoomManagementResources {
  return {
    ...resources,
    roomPrograms: {
      ...resources.roomPrograms,
      items: resources.roomPrograms.items.map((program) => ({
        ...program,
        launchConfigFields: program.launchConfigFields.filter((field) => {
          const launchField = field as PermissionedLaunchConfigField;

          return (
            !launchField.requiredPermission ||
            session.account.role.bypassAllPermissions ||
            session.account.role.permissions.includes("*") ||
            session.account.role.permissions.includes(launchField.requiredPermission)
          );
        }),
      })),
    },
  };
}
