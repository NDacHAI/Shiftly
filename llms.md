# Shiftly

> Workforce management system (shifts, schedules, attendance, leave, payroll) built as a NestJS 11 + TypeORM/MySQL REST API (`backend/`) and a React 19 + Vite + Tailwind SPA (`frontend/`). UI is bilingual (Vietnamese default, English). Business time zone is Vietnam (UTC+7).

This file is a compact map of the repository for LLMs and coding agents. Agent working rules live in [AGENTS.md](AGENTS.md); task-specific skills live in [.agents/skills/](.agents/skills/).

## Docs

- [README.md](README.md): features, environment variables, setup and commands.
- [AGENTS.md](AGENTS.md): conventions an agent must follow when editing this repo.
- [.agents/skills/shiftly-dashboard/SKILL.md](.agents/skills/shiftly-dashboard/SKILL.md): how the dashboard works and how to extend it.

## Repository layout

```text
backend/src/
  main.ts                      # CORS, global ValidationPipe (whitelist, forbidNonWhitelisted, transform)
  app.module.ts                # registers every feature module
  common/                      # UserRole enum, PasswordService (scrypt)
  database/                    # TypeORM options (timezone +07:00, synchronize=false), migrations, seeders
  module/<feature>/
    <feature>.module.ts / .controller.ts / .service.ts
    dto/                       # class-validator DTOs (query DTOs use @Type(() => Number))
    entities/                  # TypeORM entities + status enums
frontend/src/
  app/router/index.tsx         # all routes; wraps pages in <PermissionRoute> + <Layout>
  components/{ui,feedback,layout}
  constants/{routes,roles}.ts
  features/<feature>/{api,components,pages,types.ts}
  i18n/locales/{vi,en}.ts      # one nested object per feature; en.ts defines the I18nKey type
  lib/{axios,api-error}.ts     # Axios client with token refresh; API error -> i18n key mapping
```

## Domain modules (backend `module/` = REST prefix)

| Module | Route | Purpose |
|---|---|---|
| auth | `/auth` | login, refresh, logout, change-password, me (JWT access + refresh) |
| user | `/users` | accounts with roles `admin`, `manager`, `user` |
| branch, position, employee | `/branches`, `/positions`, `/employees` | org structure; employees belong to branches via `employee_branches` |
| work-shift | `/work-shifts` | shift templates (start/end time, break) |
| work-schedule | `/work-schedules` | an employee assigned to a shift on a date (snapshots shift times) |
| shift-request | `/shift-requests` | employee asks for a shift; numeric status 0-3 |
| attendance | `/attendances` | check-in/out, confirm, adjust, manual, mark-absent |
| leave-request | `/leave-requests` | leave linked to schedules via `leave_request_assignments` |
| holiday | `/holidays` | holiday dates (affects payroll multipliers) |
| salary-rule, reward-penalty-catalog | `/salary-rules`, `/reward-penalty-catalogs` | pay multipliers (NORMAL, OVERTIME, HOLIDAY, HOLIDAY_OVERTIME) and reward/penalty catalog |
| payroll-period, payroll-adjustment, payroll-processing, payslip | `/payroll-*`, `/payslips` | monthly periods, adjustments, payroll generation, finalized payslips |
| dashboard | `/dashboard` | read-only aggregates for the home page (see below) |

## Key business rules

- **Roles:** `admin` sees everything. `manager` is scoped to the branches of the employee linked to their user (`UserService.findManagedBranchIds`); controllers pass `allowedBranchIds` (`undefined` = unrestricted, `[]` = nothing). `user` only sees their own data through `employeeId` in the JWT.
- **Attendance lifecycle:** `CHECKED_IN -> PENDING_CONFIRMATION -> CONFIRMED`, or `ABSENT`. Check-in is allowed from 30 min before to 15 min after shift start, with a 5 min grace period for lateness. `workedMinutes` includes `overtimeMinutes`.
- **Payroll:** pay = `hourlyRate / 60 * minutes * multiplier`. Only `CONFIRMED` attendance is paid. A payslip is visible when the employee payroll is `FINALIZED` and the processing is `CLOSED`.
- **Dates:** `date` columns are `YYYY-MM-DD` strings. "Today" is computed in UTC+7 (`Date.now() + 7h`). Shift times are converted with `Date.UTC(y, m, d, hour - 7, ...)`.

## Dashboard API

All endpoints require `Authorization: Bearer <accessToken>`.

- `GET /dashboard/summary?branchId=<uuid>&days=7..90` (admin, manager): returns `DashboardSummary` with `todayStats`, `pending` counts, `actionItems` (missing check-ins, oldest pending leave/shift/attendance), `attendanceTrend` (per day: onTime, late, absent, onLeave, notRecorded, working), `branchHours`, `payrollTrend` (last 6 periods), `currentPayrollPeriod`, `upcomingHolidays`, `topLateEmployees`, `topOvertimeEmployees` and `branches` for the filter. Managers get 403 for a `branchId` outside their branches.
- `GET /dashboard/me` (any role with a linked employee): returns `DashboardMine` with today's schedules (with attendance state for check-in/out), the next 7 days, month-to-date stats, own requests and the latest finalized payslip. Returns 403 `Employee account is not linked` without an `employeeId`.

Response types: `backend/src/module/dashboard/types/dashboard.types.ts`, mirrored in `frontend/src/features/dashboard/types.ts`.

## Commands

```bash
cd backend && npm run start:dev      # API on :3000
cd backend && npm run test           # Jest unit tests (*.spec.ts under src/)
cd backend && npm run migration:run  # apply migrations; schema is never synchronized
cd frontend && npm run dev           # SPA on :5173
cd frontend && npm run build         # tsc -b + vite build
cd frontend && npm run lint
```
