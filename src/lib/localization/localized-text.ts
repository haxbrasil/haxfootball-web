export type LocalizedText = {
  label: string;
  value: string;
};

export function localizedTextLabel(text: LocalizedText): string {
  return text.label;
}
