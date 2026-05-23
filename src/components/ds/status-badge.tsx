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

const classNames: Record<string, string> = {
  completed: "bg-accent text-accent-foreground",
  failed: "bg-destructive text-white",
  ongoing: "bg-blue-600 text-white",
  open: "bg-primary text-primary-foreground",
  provisioning: "bg-accent text-accent-foreground",
  running: "bg-primary text-primary-foreground",
  closed: "bg-secondary text-secondary-foreground",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value ? (labels[value] ?? value) : "Indefinido";
  const variant = value === "closed" || value === "failed" ? "secondary" : "default";

  return (
    <Badge className={value ? classNames[value] : undefined} variant={variant}>
      {label}
    </Badge>
  );
}
