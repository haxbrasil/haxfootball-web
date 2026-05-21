# HaxFootball Web Deployment

`haxfootball-web` deploys as a Cloudflare Worker BFF. It serves the TanStack Start app, keeps HaxFootball API credentials server-side, stores web-owned auth/session state in D1, and uses KV only for web-owned cache data.

## Required Bindings

Configured in `wrangler.jsonc`:

- Worker name: `haxfootball-web`
- D1 binding: `DB`
- KV binding: `CACHE`
- API base URL: `https://api.bfl.haxbrasil.com/api`
- public app URL: `https://bfl.haxbrasil.com`
- stat schema name: `haxfootball`
- language: `pt`

Do not commit secret values. Configure these as Worker secrets:

```sh
wrangler secret put API_KEY
wrangler secret put AUTH_SECRET
wrangler secret put DISCORD_CLIENT_ID
wrangler secret put DISCORD_CLIENT_SECRET
```

## Local Setup

```sh
pnpm install
pnpm run cf-typegen
pnpm run db:migrate:local
pnpm dev
```

## Verification

Use the default review gate before deploying:

```sh
pnpm run verify
```

Use the full local gate when browser coverage and Storybook are needed:

```sh
pnpm run verify:full
```

`verify:full` expects Playwright Chromium to be installed locally.

The GitHub Actions workflow checks out `haxfootball-web` and `haxfootball-api-sdk` as sibling directories because the web app currently depends on the SDK through `file:../haxfootball-api-sdk`.

## Production Migration And Deploy

Run D1 migrations before deploying a Worker build that depends on them:

```sh
pnpm run db:migrate:remote
pnpm run deploy
```

After deploy, smoke test:

- `/`
- `/account/login`
- `/api/auth/sign-in/discord`
- `/rooms`
- `/matches`
- `/players`
- `/stats`
- `/admin` as an unauthenticated user, expecting redirect to login
- an admin mutation with an authorized API account, expecting the BFF permission gate to allow it

## Operational Rules

- The BFF enforces frontend permissions using HaxFootball API account role permissions.
- D1 stores only web-owned auth/session tables and credential login attempt metadata.
- KV stores only ephemeral/cache-like web data.
- HaxFootball API remains the source of truth for rooms, matches, players, accounts, roles, permissions, stat schemas, jobs, and recordings.
- Public player-facing pages are served through the BFF without requiring login.
- Environment names intentionally do not use `HAXFOOTBALL_` prefixes.
