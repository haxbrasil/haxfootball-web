import { Link } from "@tanstack/react-router";
import type { NavigationItem } from "./navigation";

export function MobileNavigation({ items }: { items: NavigationItem[] }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid border-t bg-background/95 backdrop-blur md:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="flex h-12 items-center justify-center text-xs font-medium text-muted-foreground"
          activeProps={{ className: "bg-primary text-primary-foreground" }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
