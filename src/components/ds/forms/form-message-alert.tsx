import { Alert, AlertDescription } from "#/components/ui/alert";
import type { FormMessage } from "./form-message.types";

export function FormMessageAlert({ message }: { message: FormMessage }) {
  return (
    <Alert variant={message.kind === "error" ? "destructive" : "default"}>
      <AlertDescription>{message.text}</AlertDescription>
    </Alert>
  );
}
