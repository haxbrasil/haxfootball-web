import { Link } from "@tanstack/react-router";
import type { NavigationItem } from "./navigation";

export function MobileNavigation({ items }: { items: NavigationItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t bg-background/95 backdrop-blur md:hidden">
      {items.map((item) => (
        <MobileNavigationItem key={"href" in item ? item.href : item.to} item={item} />
      ))}
    </nav>
  );
}

function MobileNavigationItem({ item }: { item: NavigationItem }) {
  const className =
    "flex h-12 min-w-20 flex-1 shrink-0 items-center justify-center px-2 text-xs font-medium whitespace-nowrap text-muted-foreground";

  if ("href" in item) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={className}>
        {item.label}
      </a>
    );
  }

  return (
    <Link
      to={item.to}
      className={className}
      activeProps={{ className: "bg-primary text-primary-foreground" }}
    >
      {item.label}
    </Link>
  );
}
