import { Link } from "@tanstack/react-router";
import type { NavigationItem } from "./navigation";

export function NavigationLink({ item, className }: { item: NavigationItem; className: string }) {
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
      activeProps={{
        className:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      }}
    >
      {item.label}
    </Link>
  );
}
