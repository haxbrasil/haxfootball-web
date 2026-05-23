import type { ComponentProps } from "react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

type ActionButtonTone = "primary" | "quiet";

const actionButtonToneClassNames: Record<ActionButtonTone, string> = {
  primary: "rounded-lg bg-primary text-primary-foreground hover:bg-primary/90",
  quiet:
    "rounded-lg border-primary/30 bg-primary/15 text-foreground shadow-xs hover:bg-primary/25 hover:text-foreground",
};

export function ActionButton({
  tone = "primary",
  variant,
  className,
  ...props
}: ComponentProps<typeof Button> & {
  tone?: ActionButtonTone;
}) {
  return (
    <Button
      variant={variant ?? (tone === "primary" ? "default" : "outline")}
      className={cn(actionButtonToneClassNames[tone], className)}
      {...props}
    />
  );
}
