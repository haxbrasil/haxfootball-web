import type { RoomLaunchConfigField } from "@haxbrasil/haxfootball-api-sdk";
import { compareVersionLabelsDescending } from "#/features/admin/utils/version-labels";
import type { LocalizedText } from "#/lib/localization/localized-text";
import type { AdminRoomManagementResources } from "#/server/api/haxfootball";

export type LaunchConfigValue = string | number | boolean | null;
export type LaunchConfigCategory = "room" | "game" | "diagnostics" | "infrastructure";
export type GeoLaunchConfigFields = {
  geoCode: WebRoomLaunchConfigField;
  geoLat: WebRoomLaunchConfigField;
  geoLon: WebRoomLaunchConfigField;
};
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

export function extractGeoLaunchConfigFields(fields: WebRoomLaunchConfigField[]): {
  geoFields: GeoLaunchConfigFields | null;
  fieldsWithoutGeo: WebRoomLaunchConfigField[];
} {
  const geoCode = fields.find((field) => field.key === "geoCode");
  const geoLat = fields.find((field) => field.key === "geoLat");
  const geoLon = fields.find((field) => field.key === "geoLon");

  if (!geoCode || !geoLat || !geoLon) {
    return {
      geoFields: null,
      fieldsWithoutGeo: fields,
    };
  }

  return {
    geoFields: { geoCode, geoLat, geoLon },
    fieldsWithoutGeo: fields.filter(
      (field) => field.key !== "geoCode" && field.key !== "geoLat" && field.key !== "geoLon",
    ),
  };
}

export function getVersionOptions(
  resources: AdminRoomManagementResources,
  programId: string,
): Array<{ label: string; value: string }> {
  const versions = getConcreteVersionOptions(resources, programId);
  const aliases =
    resources.aliasesByProgramId[programId]?.items.map((alias) => ({
      label: `${alias.alias} -> ${alias.version.version}`,
      value: alias.alias,
    })) ?? [];

  return [...aliases, ...versions];
}

export function getDefaultVersionValue(resources: AdminRoomManagementResources, programId: string) {
  return getConcreteVersionOptions(resources, programId)[0]?.value ?? "";
}

function getConcreteVersionOptions(
  resources: AdminRoomManagementResources,
  programId: string,
): Array<{ label: string; value: string }> {
  return (
    resources.versionsByProgramId[programId]?.items
      .map((version) => ({
        label: version.version,
        value: version.version,
      }))
      .sort((left, right) => compareVersionLabelsDescending(left.value, right.value)) ?? []
  );
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
