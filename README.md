# Shiftly

Shiftly is a workforce management system for managing employees, branches, shifts, work schedules, attendance, leave requests, and payroll operations.

## Link Demo and Demo Account

- Demo link: https://ndh-shiftly.vercel.app/.
- Local frontend: `http://localhost:5173`
- Local backend API: `http://localhost:3000`
- Demo account: Email: admin@admin.com, Pass: admin123.

## Docs for AI agents

- [`llms.md`](llms.md): repository map, business rules and API summary.
- [`AGENTS.md`](AGENTS.md): conventions to follow when editing the code.
- [`.agents/skills/`](.agents/skills/): task skills, for example `shiftly-dashboard`.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, React Hook Form, React Big Calendar, Recharts, Font Awesome.
- Backend: NestJS 11, TypeScript, TypeORM, MySQL, JWT authentication, class-validator, class-transformer.
- Tooling: ESLint, Prettier, Jest, TypeScript project builds, TypeORM migrations and seeders.

## Features

- Role-based dashboard: today's shift and attendance KPIs, pending approvals, attendance/payroll/branch-hour charts for admins and managers; check-in/out, upcoming shifts and latest payslip for employees.
- Authentication with JWT access tokens, refresh tokens, role-based authorization, and password change flow.
- User management with `admin`, `manager`, and `user` roles.
- Branch, position, and employee management.
- Work shift and work schedule management.
- Shift request workflow for employee schedule changes.
- Attendance tracking with attendance adjustment support.
- Leave request management with assignment tracking.
- Holiday management.
- Salary rule and reward/penalty catalog management.
- Payroll period, payroll adjustment, payroll processing, and payslip management.
- Protected frontend routes with permission checks per role.
- Vietnamese and English UI localization support.

## Architecture

Shiftly is organized as a two-app repository:

- `backend` exposes a NestJS REST API. Each business domain is implemented as a module with controller, service, DTO, entity, and module files. TypeORM handles persistence against MySQL, with migrations stored in `src/database/migrations`.
- `frontend` is a Vite React application. The UI is grouped by feature under `src/features`, shared components under `src/components`, app routing under `src/app/router`, and HTTP access through a centralized Axios client.
- Authentication is token based. The frontend stores tokens locally, attaches the access token to API requests, and attempts token refresh on unauthorized responses.
- Access control is enforced with backend JWT/role guards and frontend protected/permission routes.

## Project Structure

```text
Shiftly/
+-- backend/
|   +-- src/
|   |   +-- app.module.ts
|   |   +-- main.ts
|   |   +-- common/
|   |   +-- config/
|   |   +-- database/
|   |   |   +-- migrations/
|   |   |   +-- scripts/
|   |   |   +-- seeders/
|   |   +-- module/
|   |       +-- attendance/
|   |       +-- auth/
|   |       +-- branch/
|       +-- dashboard/
|   |       +-- employee/
|   |       +-- holiday/
|   |       +-- leave-request/
|   |       +-- payroll-adjustment/
|   |       +-- payroll-period/
|   |       +-- payroll-processing/
|   |       +-- payslip/
|   |       +-- position/
|   |       +-- reward-penalty-catalog/
|   |       +-- salary-rule/
|   |       +-- shift-request/
|   |       +-- user/
|   |       +-- work-schedule/
|   |       +-- work-shift/
|   +-- test/
|   +-- package.json
+-- frontend/
    +-- src/
    |   +-- app/
    |   +-- components/
    |   +-- constants/
    |   +-- features/
    |   +-- guards/
    |   +-- hooks/
    |   +-- i18n/
    |   +-- lib/
    |   +-- pages/
    |   +-- stores/
    +-- public/
    +-- package.json
```

## Environment Variables

Backend variables:

| Variable | Description |
| --- | --- |
| `PORT` | Backend server port. Defaults to `3000` when omitted. |
| `CORS_ORIGIN` | Comma-separated list of frontend origins allowed by CORS. |
| `DB_HOST` | MySQL host. |
| `DB_PORT` | MySQL port. |
| `DB_USER` | MySQL username. |
| `DB_PASSWORD` | MySQL password. |
| `DB_NAME` | MySQL database name. |
| `DB_SSL` | Set to `true` to enable MySQL SSL. |
| `DB_SSL_CA` | Optional CA certificate content for SSL connections. |
| `DB_SSL_REJECT_UNAUTHORIZED` | Set to `false` to disable SSL certificate validation. |
| `JWT_SECRET` | Secret used to sign access tokens. |
| `JWT_EXPIRES` | Access token expiration duration. |
| `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens. |
| `JWT_REFRESH_EXPIRES` | Refresh token expiration duration. |
| `ADMIN_EMAIL` | Admin email used by `npm run seed:admin`. |
| `ADMIN_PASSWORD` | Admin password used by `npm run seed:admin`. |

Frontend variables:

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL. Defaults to `http://localhost:3000` when omitted. |

## Getting Started

Prerequisites:

- Node.js and npm.
- MySQL database.

Backend setup:

```bash
cd backend
npm install
```

Create `backend/.env` from `backend/.env.example`, then run migrations and optionally seed the admin user:

```bash
npm run migration:run
npm run seed:admin
```

Start the backend:

```bash
npm run start:dev
```

Frontend setup:

```bash
cd frontend
npm install
```

Create `frontend/.env` from `frontend/.env.example` when the API URL is different from the default. Then start the frontend:

```bash
npm run dev
```

Build and test commands:

```bash
cd backend
npm run lint
npm run test
npm run build

cd ../frontend
npm run lint
npm run build
```
