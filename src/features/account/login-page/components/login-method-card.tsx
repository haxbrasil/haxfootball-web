import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { CredentialsLoginForm } from "./credentials-login-form";
import { DiscordLoginButton } from "./discord-login-button";

export function LoginMethodCard() {
  return (
    <Card className="bfl-panel w-full rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl">Entrar na BFL</CardTitle>
        <CardDescription>Use Discord ou uma conta com senha.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <DiscordLoginButton />

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span className="h-px bg-border" />
          <span>ou</span>
          <span className="h-px bg-border" />
        </div>

        <CredentialsLoginForm />

        <Button asChild className="w-full" variant="ghost">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Voltar para a página inicial
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
