import type { Account } from "@haxbrasil/haxfootball-api-sdk";
import { Eye } from "lucide-react";
import { FormMessageAlert } from "#/components/ds/forms/form-message";
import { Button } from "#/components/ui/button";
import { useImpersonateAccountAction } from "../hooks/use-impersonate-account-action";

export function AccountImpersonationAction({ account }: { account: Account }) {
  const action = useImpersonateAccountAction(account);

  return (
    <div className="grid min-w-36 gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={action.isSubmitting}
        onClick={action.submit}
        title={`Visualizar como ${account.name}`}
      >
        <Eye className="size-4" />
        Visualizar
      </Button>
      {action.message ? <FormMessageAlert message={action.message} /> : null}
    </div>
  );
}
