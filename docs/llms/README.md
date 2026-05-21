# LLM Documentation Snapshots

Downloaded on 2026-05-19 for `haxfootball-web` scaffolding and implementation.

These files are local reference snapshots for the frontend stack. Prefer current official docs when making version-sensitive decisions, then refresh these files when needed.

## Files

| Stack item         | Local file                    | Source                                             |
| ------------------ | ----------------------------- | -------------------------------------------------- |
| TanStack           | `tanstack.llms.txt`           | https://tanstack.com/llms.txt                      |
| Better Auth        | `better-auth.llms.txt`        | https://better-auth.com/llms.txt                   |
| Drizzle            | `drizzle.llms.txt`            | https://orm.drizzle.team/llms.txt                  |
| Drizzle full       | `drizzle.llms-full.txt`       | https://orm.drizzle.team/llms-full.txt             |
| Zod                | `zod.llms.txt`                | https://zod.dev/llms.txt                           |
| Zod full           | `zod.llms-full.txt`           | https://zod.dev/llms-full.txt                      |
| shadcn/ui          | `shadcn.llms.txt`             | https://ui.shadcn.com/llms.txt                     |
| Cloudflare Workers | `cloudflare-workers.llms.txt` | https://developers.cloudflare.com/workers/llms.txt |
| Cloudflare D1      | `cloudflare-d1.llms.txt`      | https://developers.cloudflare.com/d1/llms.txt      |
| Cloudflare KV      | `cloudflare-kv.llms.txt`      | https://developers.cloudflare.com/kv/llms.txt      |
| Oxc                | `oxc.llms.txt`                | https://oxc.rs/llms.txt                            |
| Vitest             | `vitest.llms.txt`             | https://main.vitest.dev/llms.txt                   |
| Vitest full        | `vitest.llms-full.txt`        | https://main.vitest.dev/llms-full.txt              |
| Storybook          | `storybook.llms.txt`          | https://storybook.js.org/llms.txt                  |
| Storybook full     | `storybook.llms-full.txt`     | https://storybook.js.org/llms-full.txt             |
| lucide             | `lucide.llms.txt`             | https://lucide.dev/llms.txt                        |

## No Official File Found

No official `llms.txt` file was found for these selected tools during the initial check:

- pnpm
- Tailwind CSS
- Playwright

## Refresh

Refresh these snapshots with:

```sh
cd /home/gabriel/Desktop/dev/hax/haxfootball-web/docs/llms
curl -L --fail --silent --show-error https://tanstack.com/llms.txt --output tanstack.llms.txt
curl -L --fail --silent --show-error https://better-auth.com/llms.txt --output better-auth.llms.txt
curl -L --fail --silent --show-error https://orm.drizzle.team/llms.txt --output drizzle.llms.txt
curl -L --fail --silent --show-error https://orm.drizzle.team/llms-full.txt --output drizzle.llms-full.txt
curl -L --fail --silent --show-error https://zod.dev/llms.txt --output zod.llms.txt
curl -L --fail --silent --show-error https://zod.dev/llms-full.txt --output zod.llms-full.txt
curl -L --fail --silent --show-error https://ui.shadcn.com/llms.txt --output shadcn.llms.txt
curl -L --fail --silent --show-error https://developers.cloudflare.com/workers/llms.txt --output cloudflare-workers.llms.txt
curl -L --fail --silent --show-error https://developers.cloudflare.com/d1/llms.txt --output cloudflare-d1.llms.txt
curl -L --fail --silent --show-error https://developers.cloudflare.com/kv/llms.txt --output cloudflare-kv.llms.txt
curl -L --fail --silent --show-error https://oxc.rs/llms.txt --output oxc.llms.txt
curl -L --fail --silent --show-error https://main.vitest.dev/llms.txt --output vitest.llms.txt
curl -L --fail --silent --show-error https://main.vitest.dev/llms-full.txt --output vitest.llms-full.txt
curl -L --fail --silent --show-error https://storybook.js.org/llms.txt --output storybook.llms.txt
curl -L --fail --silent --show-error https://storybook.js.org/llms-full.txt --output storybook.llms-full.txt
curl -L --fail --silent --show-error https://lucide.dev/llms.txt --output lucide.llms.txt
```
