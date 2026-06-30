export type LocalizedText = {
  label: string;
  value: string;
};

export function localizedTextLabel(text: LocalizedText | string): string {
  return typeof text === "string" ? text : text.label;
}
