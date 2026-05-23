import type { LucideIcon } from "lucide-react";
import { cn } from "#/lib/utils";

export function HomeSocialLink({
  href,
  icon: Icon,
  label,
  description,
  emphasis = "primary",
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  emphasis?: "primary" | "danger";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border bg-card/70 p-4 transition hover:border-primary/45 hover:bg-muted/55"
    >
      <span className="min-w-0">
        <span className="block text-lg font-semibold">{label}</span>
        <span className="mt-1 block text-sm leading-5 text-muted-foreground">{description}</span>
      </span>
      <span
        className={cn(
          "grid size-14 place-items-center rounded-xl",
          emphasis === "danger"
            ? "bg-destructive/15 text-destructive"
            : "bg-primary/15 text-primary",
        )}
      >
        <Icon className="size-7" />
      </span>
    </a>
  );
}
