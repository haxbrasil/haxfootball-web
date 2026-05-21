import type { RoomLaunchConfigField } from "@haxbrasil/haxfootball-api-sdk";
import type { AdminRoomManagementResources } from "#/server/api/haxfootball";

export type LaunchConfigValue = string | number | boolean | null;

export function readLaunchConfig(formData: FormData, fields: RoomLaunchConfigField[]) {
  const entries: Array<[string, LaunchConfigValue]> = [];

  for (const field of fields) {
    const key = `launchConfig.${field.key}`;
    const value = formData.get(key);

    if (field.valueType === "boolean") {
      entries.push([field.key, value === "true"]);
      continue;
    }

    if (value === null || value === "") {
      if (field.required) {
        entries.push([field.key, null]);
      }

      continue;
    }

    entries.push([field.key, field.valueType === "number" ? Number(value) : String(value)]);
  }

  return Object.fromEntries(entries);
}

export function getVersionOptions(
  resources: AdminRoomManagementResources,
  programId: string,
): Array<{ label: string; value: string }> {
  const versions =
    resources.versionsByProgramId[programId]?.items.map((version) => ({
      label: version.version,
      value: version.version,
    })) ?? [];
  const aliases =
    resources.aliasesByProgramId[programId]?.items.map((alias) => ({
      label: `${alias.alias} -> ${alias.version.version}`,
      value: alias.alias,
    })) ?? [];

  return [...aliases, ...versions];
}
