# HaxFootball Web Code Style

This guideline is based on the Bulletproof React architecture style, adapted for `haxfootball-web`, TanStack Start, Cloudflare Workers, a BFF server layer, and the BFL design system.

Reference:

- https://github.com/alan2207/bulletproof-react
- https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md

## Principles

- Keep route files thin.
- Keep feature code close to the feature that owns it.
- Keep BFF-only code under `server/*`.
- Keep HaxFootball domain data owned by `haxfootball-api`.
- Prefer BFL design-system and feature components over one-off Tailwind markup.
- Prefer explicit, boring TypeScript over clever abstractions.
- Add abstractions only after at least two real call sites need them.
- Keep components, hooks, and pure helpers in separate folders.
- Use one React component per file except inside copied `components/ui` source.

## Source Tree

```text
src/
  routes/
    __root.tsx
    index.tsx
    rooms/
      index.tsx
      $roomId.tsx
    matches/
      index.tsx
      $matchId.tsx
    players/
      index.tsx
      $playerId.tsx
    stats/
      index.tsx
    account/
      index.tsx
      login.tsx
    admin/
      index.tsx
      rooms.tsx
      room-programs.tsx
      accounts.tsx
      roles.tsx
      jobs.tsx

  components/
    ui/
    ds/

  features/
    rooms/
      list-page/
        index.tsx
        components/
        hooks/
        utils/
      detail-page/
        index.tsx
        components/
        hooks/
        utils/
      server/
      types.ts
    matches/
    players/
    stats/
    account/
    accounts/
    roles/
    permissions/
    jobs/
    room-programs/
    stat-schemas/

  server/
    api/
    sessions/
    oauth/
    permissions/

  lib/
    env.ts
    dates.ts
    formatting.ts
    stats-metrics/
      formatting.ts
      formatting.test.ts
```

## Dependency Direction

Allowed direction:

```text
routes -> features -> components/ds -> components/ui
routes -> server actions/loaders where framework requires it
features/*/server -> server/api
server/* -> lib
features/* -> lib
```

Rules:

- Routes can import feature page components, feature server functions, and shared components.
- Features can import shared components, `lib/*`, and their own files.
- Feature UI must not import directly from another feature.
- If two features need the same pure helper, move it to `lib/*` instead of importing another feature.
- Shared components must not import from features.
- Client components must not import from `server/*`.
- `server/api` is the only place that owns low-level HaxFootball API credential handling.

Compose cross-feature behavior at the route/admin shell level instead of importing feature internals into another feature.

## Routes

Route files should:

- load or call the data needed by the page
- pass loader data into a feature page component
- stay as routing/orchestration code
- keep user-facing page copy in Portuguese

Route files should not:

- own page UI beyond rendering one feature or DS component
- contain large tables/forms directly
- contain reusable components, hooks, or helper functions
- contain API credential handling
- contain D1/KV access
- contain reusable domain formatting logic
- build complex UI from raw `components/ui` primitives

## Features

Each feature owns domain-specific UI and view logic.

Typical files:

```text
features/rooms/list-page/
  index.tsx
  components/
    room-card.tsx
  hooks/
    use-room-action.ts
  utils/
    format-room-state.ts
    format-room-state.test.ts
  types.ts
```

Feature rules:

- Feature page/capability folders live directly under the feature, for example `features/admin/rooms-page` or `features/rooms/list-page`.
- Do not create a feature-level `components/` folder that only contains page folders.
- Page/capability folders use `index.tsx` as the entry point.
- Inside a page/capability folder, use `components/` for React components, `hooks/` for hooks, and `utils/` for pure helpers.
- Each component file exports one React component. Do not define helper components in the same file.
- Hook files may define local implementation functions used only by the hook, but exported pure helpers belong in `utils/`.
- Tests live inside the folder for the module they cover, for example `utils/filter-players.test.ts`.
- Shared `lib/*` helpers keep tests beside the helper, for example `lib/stats-metrics/formatting.test.ts`.
- Promote a component to `components/ds` only when reuse is real and the component API is stable.
- Keep domain mapping and formatting in `utils/`.
- Keep Zod input schemas in feature-local schema files only when they are shared across multiple modules; otherwise keep validation at the server boundary.
- Keep types local unless they are genuinely shared.
- Prefer direct imports over broad barrel exports.

## Design System

Layering:

```text
routes/pages
  -> features/*/*-page and components/ds

features/*/*-page/components and components/ds
  -> components/ui

components/ui
  -> shadcn/Radix primitives and Tailwind
```

Rules:

- `components/ui` contains the full copied shadcn component set, customized as owned source.
- `components/ds` contains cross-feature BFL application components.
- Feature components may use `components/ui` freely.
- Pages should rarely compose many raw `components/ui` primitives directly.
- If a page needs repeated UI composition, create a feature component or DS component first.
- Use `lucide-react` icons through DS or feature components.

## Server And BFF Code

`server/*` owns BFF-only behavior:

- `server/api`: HaxFootball API wrappers and server-side API credentials
- `server/sessions`: D1-backed web sessions
- `server/oauth`: Better Auth / Discord OAuth integration
- `server/permissions`: frontend authorization helpers

Rules:

- Do not expose API credentials to browser bundles.
- Do not store HaxFootball domain data in D1/KV as canonical data.
- D1 is for web-owned durable auth/session state.
- KV is for web-owned ephemeral/cache-like data.
- The BFF enforces frontend permissions before admin operations.
- The API remains client-agnostic and app-token gated.

## Data Fetching And State

- Use TanStack Query for remote data state.
- Use TanStack Table for non-trivial tables.
- Use local component state for local UI-only state.
- Avoid global state until a concrete cross-route need exists.
- Keep query keys explicit and domain-named.
- Do not compute large rankings in the browser from raw paginated API data.

## Validation And Forms

- Use Zod for BFF inputs, route params, search params, and form schemas.
- Validate all external inputs at BFF/server boundaries.
- Treat API responses as external data if they cross the BFF boundary.
- Prefer schema-derived types where practical.

## Naming

- Component files: kebab-case, for example `room-status-badge.tsx`.
- Components: PascalCase, for example `RoomStatusBadge`.
- Hooks: `useX`, for example `useRoomFilters`.
- Server functions: verb-first names, for example `listRooms`, `getMatch`, `launchRoom`.
- View model mappers: `toXView`, for example `toRoomView`.
- Zod schemas: `xSchema`, for example `loginInputSchema`.
- Prefer domain names over generic names: `roomStatus`, `matchMetrics`, `accountRole`, not `data`, `item`, or `info`.

## Exports And Imports

- Prefer named exports.
- Avoid default exports except where TanStack Start or another tool requires them.
- Prefer direct imports from concrete files.
- Avoid large barrel files for features.
- Keep import paths stable and readable.

## Styling

- Use Tailwind CSS.
- Use oxfmt for formatting; do not hand-format around the formatter.
- Keep one-off Tailwind markup out of routes when a DS or feature component should exist.
- Keep layouts dense, readable, and operational.
- No marketing landing page as the first screen.
- User-facing UI copy is Portuguese only.

## Testing

Use:

- Vitest for unit and integration tests
- Playwright for browser flows
- Storybook for DS/component inspection

Minimum expectations:

- DS primitives render and have basic accessibility coverage.
- BFF auth/session flows are tested.
- Permission gates are tested.
- API credentials are not shipped to browser bundles.
- Critical public pages render for unauthenticated users.
- Admin mutations are inaccessible to unauthorized users.

## Anti-Patterns

Avoid:

- feature pages made mostly of raw Tailwind and primitives
- cross-feature imports between feature internals
- browser imports from `server/*`
- API credentials or privileged JWTs in browser code
- duplicating HaxFootball domain data in D1/KV
- generic abstractions with only one real usage
- route files that own complex tables/forms directly
- component files that define multiple components
- hooks mixed into component folders
- pure helpers mixed into component or hook files when they are reusable or tested
- English user-facing copy in production UI
