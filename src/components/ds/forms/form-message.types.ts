export type FormMessage =
  | {
      kind: "success";
      text: string;
    }
  | {
      kind: "error";
      text: string;
    };
