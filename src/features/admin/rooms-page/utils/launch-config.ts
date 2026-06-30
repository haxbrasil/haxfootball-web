import type { RoomLaunchConfigField } from "@haxbrasil/haxfootball-api-sdk";
import type { AdminRoomManagementResources } from "#/server/api/haxfootball";
import type { LocalizedText } from "#/lib/localization/localized-text";

export type LaunchConfigValue = string | number | boolean | null;
export type LaunchConfigCategory = "room" | "game" | "diagnostics" | "infrastructure";
export type WebRoomLaunchConfigField = Omit<
  RoomLaunchConfigField,
  "displayName" | "description"
> & {
  label: LocalizedText;
  category: LaunchConfigCategory;
  description?: LocalizedText;
  requiredPermission?: string;
};

export const launchConfigCategoryLabels: Record<LaunchConfigCategory, string> = {
  room: "Configurações da sala",
  game: "Configurações do HaxFootball",
  diagnostics: "Diagnóstico",
  infrastructure: "Infraestrutura",
};

export const launchConfigCategoryOrder: LaunchConfigCategory[] = [
  "room",
  "game",
  "diagnostics",
  "infrastructure",
];

export function readLaunchConfig(formData: FormData, fields: WebRoomLaunchConfigField[]) {
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
    resources.versionsByProgramId[programId]?.items
      .map((version) => ({
        label: version.version,
        value: version.version,
      }))
      .sort((left, right) => compareVersionLabels(left.value, right.value)) ?? [];
  const aliases =
    resources.aliasesByProgramId[programId]?.items.map((alias) => ({
      label: `${alias.alias} -> ${alias.version.version}`,
      value: alias.alias,
    })) ?? [];

  return [...aliases, ...versions];
}

function compareVersionLabels(left: string, right: string) {
  const leftParts = parseVersionLabel(left);
  const rightParts = parseVersionLabel(right);

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return left.localeCompare(right);
}

function parseVersionLabel(version: string) {
  const normalizedVersion = version.startsWith("v") ? version.slice(1) : version;

  return normalizedVersion.split(".").map((part) => Number.parseInt(part, 10) || 0);
}

export function groupedLaunchConfigFields(fields: WebRoomLaunchConfigField[]) {
  return launchConfigCategoryOrder
    .map((category) => ({
      category,
      label: launchConfigCategoryLabels[category],
      fields: fields.filter((field) => field.category === category),
    }))
    .filter((group) => group.fields.length > 0);
}
