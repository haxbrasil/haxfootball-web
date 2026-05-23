import { NavigationLink } from "./navigation-link";
import { adminNavigationItem } from "./navigation";
import { desktopNavigationLinkClassName } from "./desktop-navigation";

export function AdminNavigationLink() {
  return (
    <NavigationLink
      item={adminNavigationItem}
      className={`hidden ${desktopNavigationLinkClassName} md:inline-flex`}
    />
  );
}
