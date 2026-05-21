import serverEntry from "@tanstack/react-start/server-entry";
import { runWithCloudflareEnv, type CloudflareBindings } from "#/server/cloudflare";

export default {
  fetch(request: Request, env: CloudflareBindings, _context: ExecutionContext) {
    return runWithCloudflareEnv(env, () => serverEntry.fetch(request));
  },
};
