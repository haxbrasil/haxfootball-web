export function useServerFn<T extends (...args: never[]) => unknown>(serverFn: T): T {
  return serverFn;
}

export function createServerFn() {
  const builder = {
    inputValidator() {
      return builder;
    },
    validator() {
      return builder;
    },
    handler() {
      return async () => {
        throw new Error("Server operations are not available in static stories.");
      };
    },
  };
  return builder;
}
