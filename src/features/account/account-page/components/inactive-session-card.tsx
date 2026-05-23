import { useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

export function InactiveSessionCard() {
  const navigate = useNavigate();

  function handleLoginClick() {
    void navigate({ to: "/account/login" });
  }

  return (
    <Card className="bfl-panel max-w-lg rounded-xl">
      <CardHeader>
        <CardTitle>Entre para ver sua conta BFL</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Acesse sua identidade, cargo e atalhos da BFL.
        </p>
        <Button onClick={handleLoginClick}>
          <LogIn className="size-4" />
          Entrar
        </Button>
      </CardContent>
    </Card>
  );
}
