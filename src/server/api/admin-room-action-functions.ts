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

const launchConfigValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const launchRoomInput = z.object({
  programId: z.string().min(1),
  version: z.string().min(1),
  haxballToken: z.string().min(1),
  launchConfig: z.record(z.string(), launchConfigValue).optional(),
});

export const launchRoomFn = createServerFn({ method: "POST" })
  .inputValidator(launchRoomInput)
  .handler(async ({ data }) => {
    const { launchRoom, listAdminRoomManagementResources } =
      await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");
    const session = await requireApiPermission("room-launch:operate");
    const resources = filterLaunchConfigFields(await listAdminRoomManagementResources(), session);
    const selectedProgram = resources.roomPrograms.items.find(
      (program) => program.id === data.programId,
    );

    if (!selectedProgram) {
      return { ok: false, message: "Programa de sala inválido." } as const;
    }

    const allowedKeys = new Set(selectedProgram.launchConfigFields.map((field) => field.key));
    const submittedKeys = Object.keys(data.launchConfig ?? {});

    if (submittedKeys.some((key) => !allowedKeys.has(key))) {
      return { ok: false, message: "Configuração de sala não autorizada." } as const;
    }

    const room = await launchRoom(data);

    return room
      ? ({ ok: true, room } as const)
      : ({ ok: false, message: "Não foi possível lançar a sala." } as const);
  });

export const closeRoomFn = createServerFn({ method: "POST" })
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const { closeRoom } = await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");

    await requireApiPermission("room-launch:operate");

    const room = await closeRoom(data.id);

    return room
      ? ({ ok: true, room } as const)
      : ({ ok: false, message: "Não foi possível fechar a sala." } as const);
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
