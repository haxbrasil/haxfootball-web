import { HeadContent, Scripts } from "@tanstack/react-router";
import { AppShell } from "#/components/ds/app-shell";

export function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <Scripts />
      </body>
    </html>
  );
}
