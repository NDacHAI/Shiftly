# Agent guide for Shiftly

Instructions for coding agents (Claude Code, Codex, Cursor, ...) working in this repository. Read [llms.md](llms.md) first for the project map. Skills for specific areas are in [.agents/skills/](.agents/skills/).

## Before you change code

- Find a sibling module or page and copy its shape. Backend features live in `backend/src/module/<feature>/`; frontend features live in `frontend/src/features/<feature>/`.
- Use the `@/` path alias in both apps (`@/module/...` in backend, `@/components/...` in frontend).
- Keep each file's existing line endings and BOM. Several files use CRLF and/or a UTF-8 BOM (for example `backend/src/app.module.ts` and `frontend/src/i18n/locales/en.ts`).

## Backend rules

- Protect controllers with `@UseGuards(JwtAuthGuard, RolesGuard)` and a class-level `@Roles(...)`, then narrow per handler.
- Manager scope: resolve `allowedBranchIds` in the controller (`userService.findManagedBranchIds` for managers, `undefined` otherwise) and filter every query by branch. An empty array must return no rows (`andWhere('1 = 0')`), not every row.
- Validate input with class-validator DTOs. The global `ValidationPipe` rejects unknown fields.
- Never enable `synchronize`. Schema changes need a migration in `backend/src/database/migrations` (`npm run migration:generate`).
- Use `dataSource.transaction` and the existing `findLocked...` helpers for state changes that must not race.
- Error messages are English strings that the frontend maps to i18n keys (`frontend/src/lib/api-error.ts` or the feature's `get...ErrorKey`). When you add a new message, add its mapping too.
- Compute dates in Vietnam time (UTC+7). Treat `date` columns as `YYYY-MM-DD` strings.
- In raw `getRawMany()` queries, wrap date columns with `DATE_FORMAT(..., '%Y-%m-%d')` and convert SUM/COUNT strings with `Number`.

## Frontend rules

- Call the API through `api` from `@/lib/axios` in `features/<feature>/api/*.api.ts`. Never call `fetch` directly.
- Every user-facing string goes through `useI18n().t`. Add each key to both `i18n/locales/vi.ts` and `en.ts`; `en.ts` defines the `I18nKey` type, so a key missing there fails the type-check. `t` has no interpolation; use `{name}` placeholders with the dashboard `interpolate` helper.
- Register routes in `app/router/index.tsx` with `<PermissionRoute allowedRoles=...>` and `<Layout>`, and add the path to `constants/routes.ts`.
- Do not call a function that synchronously sets state from inside `useEffect` (rule `react-hooks/set-state-in-effect`). Start the request in the effect and set state only in `.then`/`.catch`, with a `cancelled` flag. See `features/dashboard/pages/ManagerDashboard.tsx`.
- Charts use Recharts with the palette in `features/dashboard/lib/chart-colors.ts`. Keep one y-axis, render text in slate ink rather than series colors, and provide a table view through `DashboardCard`'s `table` prop.

## Verify before finishing

```bash
cd backend && npx tsc --noEmit -p tsconfig.json && npm run test
cd frontend && npx tsc -b && npx eslint src/features/<feature> && npm run build
```

The repository already has some lint errors outside the features you touch. Do not add new ones, and do not reformat unrelated files.
