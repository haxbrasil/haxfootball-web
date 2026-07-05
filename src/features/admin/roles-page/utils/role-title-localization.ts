import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import type { Language, LocalizedValue } from "#/server/api/haxfootball";
import { localizedTextLabel } from "#/lib/localization/localized-text";

export type RoleTitleLabels = Record<string, string>;

export function isLocalizationValueKey(value: string): boolean {
  return /^[a-z][a-z0-9.-]{0,127}$/.test(value);
}

export function roleTitleKey(role: Role): string {
  return isLocalizationValueKey(role.title.value) ? role.title.value : `role.${role.name}.title`;
}

export function roleTitleLabels(input: {
  role: Role;
  languages: Language[];
  value: LocalizedValue | null | undefined;
}): RoleTitleLabels {
  const fallback = localizedTextLabel(input.role.title);
  const labelsByLanguage = new Map(
    input.value?.labels.map((entry) => [entry.language.code, entry.label]) ?? [],
  );

  return Object.fromEntries(
    input.languages.map((language) => [
      language.code,
      labelsByLanguage.get(language.code) ?? fallback,
    ]),
  );
}

export function trimRoleTitleLabels(labels: RoleTitleLabels): RoleTitleLabels {
  return Object.fromEntries(
    Object.entries(labels).map(([language, label]) => [language, label.trim()]),
  );
}
