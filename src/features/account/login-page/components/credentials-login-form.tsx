import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useCredentialsLoginForm } from "../hooks/use-credentials-login-form";

export function CredentialsLoginForm() {
  const form = useCredentialsLoginForm();

  return (
    <>
      {form.message ? (
        <Alert variant="destructive">
          <AlertDescription>{form.message}</AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={form.submit}>
        <div className="space-y-2">
          <Label htmlFor="name">Conta</Label>
          <Input
            id="name"
            name="name"
            autoComplete="username"
            required
            className="bg-background/60"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="bg-background/60"
          />
        </div>
        <Button className="w-full" disabled={form.isSubmitting} type="submit">
          {form.isSubmitting ? "Entrando..." : "Entrar com senha"}
        </Button>
      </form>
    </>
  );
}
