import { Alert, AlertDescription } from "#/components/ui/alert";

export type FormMessage =
  | {
      kind: "success";
      text: string;
    }
  | {
      kind: "error";
      text: string;
    };

export function FormMessageAlert({ message }: { message: FormMessage }) {
  return (
    <Alert variant={message.kind === "error" ? "destructive" : "default"}>
      <AlertDescription>{message.text}</AlertDescription>
    </Alert>
  );
}

export function InlineFormMessage({ message }: { message: FormMessage }) {
  return (
    <p
      className={
        message.kind === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"
      }
    >
      {message.text}
    </p>
  );
}
