import { useEffect } from "react";
import { toast } from "sonner";
import type { FormMessage } from "./form-message.types";

export function FormMessageToast({ message }: { message: FormMessage }) {
  useEffect(() => {
    if (message.kind === "error") {
      toast.error(message.text);
    } else {
      toast.success(message.text);
    }
  }, [message.kind, message.text]);

  return null;
}
