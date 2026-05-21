import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

export function InactiveSessionCard() {
  const navigate = useNavigate();

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Nenhuma sessão ativa</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => navigate({ to: "/account/login" })}>Entrar</Button>
      </CardContent>
    </Card>
  );
}
