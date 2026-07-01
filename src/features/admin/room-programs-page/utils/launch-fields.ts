export type LaunchFieldCategory = "room" | "game" | "diagnostics" | "infrastructure";
export type LaunchFieldValueType = "string" | "number" | "boolean";
type LocalizedText = { value: string; label: string };
type WebLaunchConfigField = {
  key: string;
  label?: LocalizedText | string;
  displayName?: string;
  category?: LaunchFieldCategory;
  valueType: LaunchFieldValueType;
  required: boolean;
  defaultValue?: string | number | boolean | null;
  secret: boolean;
  envVar: string;
  description?: LocalizedText | string;
  enumValues?: string[];
  minimum?: number;
  maximum?: number;
  requiredPermission?: string;
};
export type EditableLaunchField = {
  key: string;
  label: string;
  category: LaunchFieldCategory;
  valueType: LaunchFieldValueType;
  required: boolean;
  defaultValue: string;
  defaultEnabled: boolean;
  secret: boolean;
  envVar: string;
  description: string;
  enumValues: string;
  minimum: string;
  maximum: string;
  requiredPermission: string;
};

export type SerializedLaunchField = {
  key: string;
  label: string;
  category: LaunchFieldCategory;
  valueType: LaunchFieldValueType;
  required: boolean;
  defaultValue?: string | number | boolean | null;
  secret: boolean;
  envVar: string;
  description?: string;
  enumValues?: string[];
  minimum?: number;
  maximum?: number;
  requiredPermission?: string;
};

export function editableLaunchField(field: WebLaunchConfigField): EditableLaunchField {
  return {
    key: field.key,
    label: localizedValue(field.label) || field.displayName || field.key,
    category: field.category ?? "game",
    valueType: field.valueType as LaunchFieldValueType,
    required: field.required,
    defaultValue:
      field.defaultValue === undefined || field.defaultValue === null
        ? ""
        : String(field.defaultValue),
    defaultEnabled: field.defaultValue !== undefined,
    secret: field.secret,
    envVar: field.envVar,
    description: localizedValue(field.description),
    enumValues: field.enumValues?.join("\n") ?? "",
    minimum: field.minimum === undefined ? "" : String(field.minimum),
    maximum: field.maximum === undefined ? "" : String(field.maximum),
    requiredPermission: field.requiredPermission ?? "",
  };
}

function localizedValue(value: LocalizedText | string | undefined) {
  if (!value) return "";

  return typeof value === "string" ? value : value.value;
}

export function newLaunchField(): EditableLaunchField {
  return {
    key: "",
    label: "",
    category: "game",
    valueType: "string",
    required: false,
    defaultValue: "",
    defaultEnabled: false,
    secret: false,
    envVar: "",
    description: "",
    enumValues: "",
    minimum: "",
    maximum: "",
    requiredPermission: "",
  };
}

export function serializeLaunchFields(fields: EditableLaunchField[]): {
  fields: SerializedLaunchField[];
  errors: string[];
} {
  const errors: string[] = [];
  const keys = new Set<string>();
  const envVars = new Set<string>();
  const serialized = fields.map((field, index) => {
    const position = `Campo ${index + 1}`;
    const key = field.key.trim();
    const envVar = field.envVar.trim();
    const label = field.label.trim();
    const description = field.description.trim();
    const requiredPermission = field.requiredPermission.trim();
    const enumValues = splitLines(field.enumValues);
    const minimum = optionalNumber(field.minimum, `${position}: mínimo`, errors);
    const maximum = optionalNumber(field.maximum, `${position}: máximo`, errors);
    const output: SerializedLaunchField = {
      key,
      label,
      category: field.category,
      valueType: field.valueType,
      required: field.required,
      secret: field.secret,
      envVar,
    };

    if (!key) errors.push(`${position}: informe a chave.`);
    if (!label) errors.push(`${position}: informe o label.`);
    if (!envVar) errors.push(`${position}: informe a variável de ambiente.`);
    if (keys.has(key)) errors.push(`${position}: chave duplicada.`);
    if (envVars.has(envVar)) errors.push(`${position}: variável de ambiente duplicada.`);
    if (enumValues.length && field.valueType !== "string") {
      errors.push(`${position}: enum só pode ser usado com campos string.`);
    }

    keys.add(key);
    envVars.add(envVar);

    if (description) output.description = description;
    if (enumValues.length) output.enumValues = enumValues;
    if (minimum !== undefined) output.minimum = minimum;
    if (maximum !== undefined) output.maximum = maximum;
    if (requiredPermission) output.requiredPermission = requiredPermission;

    if (field.defaultEnabled) {
      const defaultValue = parseDefaultValue(field);

      if (!defaultValue.ok) {
        errors.push(`${position}: ${defaultValue.message}`);
      } else {
        output.defaultValue = defaultValue.value;
      }
    }

    return output;
  });

  return { fields: serialized, errors };
}

function parseDefaultValue(
  field: EditableLaunchField,
): { ok: true; value: string | number | boolean | null } | { ok: false; message: string } {
  const raw = field.defaultValue.trim();

  if (raw === "") {
    return { ok: true, value: null };
  }

  if (field.valueType === "number") {
    const value = Number(raw);

    return Number.isFinite(value)
      ? { ok: true, value }
      : { ok: false, message: "default numérico inválido." };
  }

  if (field.valueType === "boolean") {
    if (raw === "true") return { ok: true, value: true };
    if (raw === "false") return { ok: true, value: false };

    return { ok: false, message: "default booleano deve ser true ou false." };
  }

  return { ok: true, value: raw };
}

function optionalNumber(value: string, label: string, errors: string[]): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) return undefined;

  const number = Number(trimmed);

  if (!Number.isFinite(number)) {
    errors.push(`${label} inválido.`);

    return undefined;
  }

  return number;
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}
