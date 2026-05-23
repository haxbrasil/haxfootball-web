import { cn } from "#/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/bfl-logo.png"
      alt="BFL"
      className={cn("aspect-[934/1088] object-contain", className)}
      width={934}
      height={1088}
    />
  );
}
