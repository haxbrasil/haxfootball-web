export function useServerFn<T extends (...args: never[]) => unknown>(serverFn: T): T {
  return serverFn;
}
