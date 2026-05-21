import { Badge } from "#/components/ui/badge";

const labels: Record<string, string> = {
  open: "Aberta",
  provisioning: "Provisionando",
  running: "Rodando",
  closed: "Fechada",
  ongoing: "Em andamento",
  completed: "Finalizada",
  failed: "Falhou",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value ? (labels[value] ?? value) : "Indefinido";
  const variant = value === "closed" || value === "failed" ? "secondary" : "default";

  return <Badge variant={variant}>{label}</Badge>;
}
