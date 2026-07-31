import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { TooltipProvider } from "#/components/ui/tooltip";
import { canAccessImplementedAdmin } from "#/features/admin/admin-sections";
import type { ApiAccountSession } from "#/server/auth/session";
import { AccountNavLink } from "./account-nav-link";
import { AdminNavigationLink } from "./admin-navigation-link";
import { AppLogoLink } from "./app-logo-link";
import { DesktopNavigation } from "./desktop-navigation";
import { ImpersonationBanner } from "./impersonation-banner";
import { MobileNavigation } from "./mobile-navigation";
import { adminNavigationItem, getNavigation } from "./navigation";
import { isChampionshipEditorPath } from "./app-shell-mode";

export function AppShell({
  children,
  session,
}: {
  children: ReactNode;
  session?: ApiAccountSession | null;
}) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const isChampionshipEditor = isChampionshipEditorPath(pathname);
  const canAccessAdmin = canAccessImplementedAdmin(session);
  const visibleNavigation = getNavigation();
  const mobileNavigationItems = canAccessAdmin
    ? [...visibleNavigation, adminNavigationItem]
    : visibleNavigation;

  return (
    <TooltipProvider>
      <div className="min-h-screen text-foreground">
        {isChampionshipEditor ? null : (
          <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
            <AppLogoLink />

            <DesktopNavigation items={visibleNavigation} />

            <div className="ml-auto flex items-center gap-2">
              {canAccessAdmin ? <AdminNavigationLink /> : null}
              <AccountNavLink session={session} />
            </div>
          </div>
          </header>
        )}
        {session?.impersonation ? <ImpersonationBanner session={session} /> : null}

        <main
          className={
            isChampionshipEditor
              ? "w-full"
              : "mx-auto w-full max-w-7xl px-4 py-6 pb-20 md:pb-8"
          }
        >
          {children}
        </main>

        {isChampionshipEditor ? null : <MobileNavigation items={mobileNavigationItems} />}
      </div>
    </TooltipProvider>
  );
}
