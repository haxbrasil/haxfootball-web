import type { FormMessage } from "./form-message.types";

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
