import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3, CircleUserRound, Trophy } from "lucide-react";
import { Button } from "#/components/ui/button";
import { TooltipProvider } from "#/components/ui/tooltip";
import { navigation } from "./navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
            <Link to="/" className="flex items-center gap-2 font-semibold tracking-normal">
              <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
                <Trophy className="size-4" />
              </span>
              <span>BFL</span>
            </Link>

            <nav className="ml-2 hidden items-center gap-1 md:flex">
              {navigation.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-muted text-foreground" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <Button asChild size="sm" variant="ghost">
                <Link to="/account/login">
                  <CircleUserRound className="size-4" />
                  Entrar
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/stats">
                  <BarChart3 className="size-4" />
                  Rankings
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background md:hidden">
          {navigation.slice(1, 6).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex h-12 items-center justify-center text-xs text-muted-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </TooltipProvider>
  );
}
