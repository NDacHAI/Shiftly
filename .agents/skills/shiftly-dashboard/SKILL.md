---
name: shiftly-dashboard
description: Use when changing or extending the Shiftly home dashboard (the backend /dashboard API or the frontend features/dashboard UI): adding a KPI card, a chart, an action-item list or an employee widget, or debugging dashboard numbers.
---

# Shiftly dashboard

The dashboard is the `/` route. Admins and managers see an operations overview. Employees (`user` role) see their own shifts, with check-in and check-out buttons.

## Where things live

| Layer | Path |
|---|---|
| API module | `backend/src/module/dashboard/` (`dashboard.module.ts`, `.controller.ts`, `.service.ts`) |
| Query DTO | `backend/src/module/dashboard/dto/dashboard-query.dto.ts` (`branchId?`, `days` 7..90) |
| Response types | `backend/src/module/dashboard/types/dashboard.types.ts` |
| Date helpers and tests | `backend/src/module/dashboard/dashboard.utils.ts` and `dashboard.utils.spec.ts` |
| Frontend types and API | `frontend/src/features/dashboard/types.ts`, `api/dashboard.api.ts` |
| Pages | `features/dashboard/pages/DashboardPage.tsx` (picks the page by role), `ManagerDashboard.tsx`, `EmployeeDashboard.tsx` |
| Components | `features/dashboard/components/*` (StatCard, DashboardCard, ChartTooltip, ChartLegend, AttendanceTrendChart, BranchHoursChart, PayrollTrendChart, ActionItemsPanel, RankingList, PayrollPeriodCard, MyShiftList) |
| Helpers | `features/dashboard/lib/format.ts` (dates and money, `interpolate`), `lib/chart-colors.ts` |
| Translations | the `dashboard` block in `frontend/src/i18n/locales/vi.ts` and `en.ts` |

## Endpoints

- `GET /dashboard/summary` (admin, manager). The service runs every aggregate in parallel (`Promise.all`) and returns a single `DashboardSummary`.
- `GET /dashboard/me` (all roles). Requires `employeeId` in the JWT and returns `DashboardMine`.

## How the numbers are computed

- **Daily attendance stats** (`aggregateDailyStats`): `work_schedules` LEFT JOIN `attendances` grouped by `workDate`. Each scheduled shift falls into exactly one bucket:
  - `onTime`: checked in with `lateMinutes = 0`
  - `late`: checked in with `lateMinutes > 0`
  - `absent`: status `ABSENT`
  - `onLeave`: no attendance, and an APPROVED leave assignment exists
  - `notRecorded`: no attendance and no approved leave

  `working` (status `CHECKED_IN`) overlaps with `onTime`/`late` and is shown only as a KPI. Days without schedules are filled with zeros, so the series is continuous.
- **Missing check-ins:** today's schedules with no attendance and no approved leave whose start time is more than 5 minutes ago (`MISSING_CHECK_IN_AFTER_MINUTES`).
- **Branch hours:** sums of `workedMinutes` and `overtimeMinutes` for `PENDING_CONFIRMATION` and `CONFIRMED` attendance. `workedMinutes` already contains overtime, so the UI plots `worked - overtime` and `overtime` as two stacked segments.
- **Payroll trend:** `employee_payrolls` with status SUCCESS or FINALIZED, grouped by period (last 6, oldest first). `holidayPay` already includes holiday overtime.
- **Branch scope:** `resolveBranchScope` turns `branchId` plus the manager's `allowedBranchIds` into a filter, and `applyBranchScope` applies it to every query. An empty array means "no data".

## Adding something

1. **New metric:** add a private aggregate method in `DashboardService` and call it from the `Promise.all` in `getSummary` or `getMine`. Then add the field to `types/dashboard.types.ts` and mirror it in `frontend/src/features/dashboard/types.ts`. Keep aggregation in SQL (`COUNT`/`SUM` with `GROUP BY`); do not load rows and count them in JS.
2. **Raw SQL:** in `getRawMany`, use property paths for registered aliases (`attendance.lateMinutes`) and real column names only inside hand-written subqueries such as `APPROVED_LEAVE_EXISTS`. Format dates with `DATE_FORMAT` and wrap aggregates with `toNumber`.
3. **New chart:** wrap it in `DashboardCard` and pass a `table` so values are reachable without the chart.
   - Use `ChartTooltip` for hover and `ChartLegend` for the legend.
   - Take colors from `chartColors` in fixed order (`series1`, `series2`, ...). Use status colors (`good`, `warning`, `critical`) only for attendance states.
   - Keep one y-axis. Measures with different units go in separate charts.
4. **New text:** add keys to both locale files. Use `{placeholder}` with `interpolate(t('...'), { placeholder })`.
5. **Data loading:** follow the effect pattern in `ManagerDashboard.tsx`: a `cancelled` flag, state set only in promise callbacks, and `setLoading(true)` in the event handlers that change filters.

## Verify

```bash
cd backend && npx jest src/module/dashboard && npx tsc --noEmit -p tsconfig.json
cd frontend && npx tsc -b && npx eslint src/features/dashboard && npm run build
```

For a manual check, log in as `admin@admin.com`, open `/`, and switch between 7, 30 and 90 days. The demo data is mostly in July 2026, so the 90-day range shows it. Toggle "Xem dạng bảng" and confirm the table matches the chart.
