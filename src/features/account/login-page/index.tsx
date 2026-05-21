import { Link } from "@tanstack/react-router";
import { PageHeader } from "#/components/ds/app-shell";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { CredentialsLoginForm } from "./components/credentials-login-form";
import { DiscordLoginButton } from "./components/discord-login-button";

export function LoginPage() {
  return (
    <>
      <PageHeader title="Entrar" description="Acesso por Discord ou credenciais." />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Conta BFL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DiscordLoginButton />
          <CredentialsLoginForm />
          <Button asChild className="w-full" variant="ghost">
            <Link to="/">Voltar</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
