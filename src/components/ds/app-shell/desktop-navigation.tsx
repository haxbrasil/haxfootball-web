import { NavigationLink } from "./navigation-link";
import type { NavigationItem } from "./navigation";

const desktopNavigationLinkClassName =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground";

export function DesktopNavigation({ items }: { items: NavigationItem[] }) {
  return (
    <nav className="ml-2 hidden items-center gap-1 md:flex">
      {items.map((item) => (
        <NavigationLink
          key={"href" in item ? item.href : item.to}
          item={item}
          className={desktopNavigationLinkClassName}
        />
      ))}
    </nav>
  );
}

export { desktopNavigationLinkClassName };
