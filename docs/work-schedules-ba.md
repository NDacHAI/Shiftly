# BA Document - Work Schedules

## 1. Overview

Work Schedules are used to assign one Work Shift to one employee on a specific work date.

```text
Work Shift -> Work Schedule -> Attendance
```

- Work Shift: reusable shift template, for example `HC01 - 08:00-17:00`.
- Work Schedule: assigned schedule containing employee, shift, branch, position, and work date.
- `workDate` is the date the shift starts.
- For overnight shifts such as `22:00-06:00`, `workDate = 2026-07-01` and the end time belongs to `2026-07-02`.
- A date without Work Schedule means the employee has not been scheduled. Version 1 does not create `OFF` or `Leave` shifts.

## 2. Version 1 Scope

Supported:

- List view, week view, and month view.
- Create, update, and hard delete valid schedules.
- Bulk schedule assignment for multiple employees over a date range and optional weekdays.
- Filters by date range, branch, position, employee, work shift, and employee keyword.
- Conflict validation, including overnight shifts.
- Employee user views their own schedules.

Not supported in Version 1:

- Recurring schedule templates or copying previous weeks.
- Open shifts, employee shift registration, shift swap, or cancellation requests.
- Overtime, holidays, automatic notifications.
- Payroll calculation.

## 3. Roles And Permissions

The current codebase uses these roles:

| Product term | Current code role | Permission |
| --- | --- | --- |
| Admin | `admin` | Manage all work schedules. |
| Manager | `manager` | View and manage schedules within allowed branches. |
| Employee | `user` | View only their own schedules through the linked `employeeId`. |

Manager branch scope is resolved from the employee profile linked to the manager account:

```text
users.employee_id -> employees.id -> employee_branches.branch_id
```

If a manager account has no linked `employeeId` or no assigned branch, it should not be able to modify schedules and should only see an empty scoped result.

## 4. Data Model

Relationships:

```text
Employee 1 --- N Work Schedules
Work Shift 1 --- N Work Schedules
Branch 1 --- N Work Schedules
Position 1 --- N Work Schedules
```

Each Work Schedule belongs to one employee, one work shift, one branch, and one position.

## 5. Shift Snapshot

When creating a schedule or changing its `workShiftId`, the system stores a shift snapshot:

```text
shiftCodeSnapshot
shiftNameSnapshot
startTimeSnapshot
endTimeSnapshot
breakMinutesSnapshot
isOvernightSnapshot
```

Existing Work Schedules must not change when the original Work Shift is edited later. Attendance must read scheduled hours from this snapshot, not from the current Work Shift record.

`isOvernightSnapshot` can be stored directly from `WorkShift.isOvernight`; it can also be recalculated from `startTimeSnapshot > endTimeSnapshot`, but storing it makes responses and debugging clearer.

## 6. Working Duration

```text
workingDurationMinutes = total shift minutes - breakMinutesSnapshot
```

This field is calculated in responses. It does not need a database column.

## 7. Current Codebase Alignment

Important field mappings:

| Business meaning | Current code field |
| --- | --- |
| Employee join date | `employees.hire_date` / `Employee.hireDate` |
| Employee active status | `Employee.status = Active` |
| Branch active status | `Branch.status = true` |
| Position active status | `Position.status = true` |
| Work Shift active status | `WorkShift.status = 1` / `Status.ACTIVE` |
| Employee account link | `users.employee_id` / `AuthUser.employeeId` |
| Employee allowed branches | `employee_branches` |
| Employee allowed positions | `employee_positions` |
| Position branch | `positions.branch_id` / `Position.branchId` |

## 8. Business Rules

| Code | Rule |
| --- | --- |
| BR-01 | Employee, Branch, Position, and Work Shift must exist and be active. |
| BR-02 | Employee must be assigned to the selected Branch through `employee_branches`. |
| BR-03 | Employee must be assigned to the selected Position through `employee_positions`. |
| BR-04 | The selected Position must belong to the selected Branch: `position.branchId === branchId`. |
| BR-05 | `workDate` must not be earlier than `Employee.hireDate`. |
| BR-06 | One Employee can have at most one Work Schedule starting on the same `workDate`. |
| BR-07 | Schedules must not overlap with the previous or next schedule, including overnight shifts. |
| BR-08 | Overnight shift means `startTimeSnapshot > endTimeSnapshot` or `isOvernightSnapshot = true`. |
| BR-09 | Editing a Work Shift does not mutate existing Work Schedule snapshots. |
| BR-10 | Schedules with Attendance, check-in/check-out, locked timesheet, or applied Leave Request cannot be updated or deleted. |
| BR-11 | Attendance uses Work Schedule snapshot fields. |

Invalid overlap example:

```text
2026-06-30: 22:00-06:00
2026-07-01: 05:00-13:00
```

## 9. Create Schedule

Input:

```ts
type CreateWorkScheduleDto = {
  employeeId: string;
  branchId: string;
  positionId: string;
  workShiftId: string;
  workDate: string;
  note?: string;
};
```

Processing:

1. Validate Employee is active.
2. Validate Branch is active.
3. Validate Position is active.
4. Validate Work Shift is active.
5. Validate employee-branch assignment.
6. Validate employee-position assignment.
7. Validate position belongs to branch.
8. Validate `workDate >= employee.hireDate`.
9. Validate no same-day schedule exists.
10. Validate no time overlap with adjacent schedules.
11. Save schedule with shift snapshot.

## 10. Update Schedule

Editable fields:

```ts
type UpdateWorkScheduleDto = {
  branchId?: string;
  positionId?: string;
  workShiftId?: string;
  workDate?: string;
  note?: string;
};
```

Rules:

- Re-run all create validations using the updated values.
- If `workShiftId` changes, refresh all snapshot fields.
- Do not allow update if related Attendance, check-in/check-out, locked timesheet, or applied Leave Request exists.
- Until Attendance and Leave Request modules exist, keep this rule as a service guard that can be expanded later.

## 11. Delete Schedule

- Version 1 uses hard delete only.
- Delete is allowed only when the schedule has no related Attendance, check-in/check-out, locked timesheet, or applied Leave Request.
- If related data exists, keep the schedule for audit/history.

## 12. Bulk Assignment

Input:

```ts
type BulkCreateWorkSchedulesDto = {
  employeeIds: string[];
  branchId: string;
  positionId: string;
  workShiftId: string;
  startDate: string;
  endDate: string;
  weekdays?: number[]; // 1 = Monday, 7 = Sunday
  note?: string;
  conflictStrategy: 'SKIP' | 'REPLACE';
};
```

Conflict strategies:

- `SKIP`: keep existing schedules, create only non-conflicting records, and return skipped items.
- `REPLACE`: replace only schedules that have no related data. Schedules with related data are returned as failures.

Response should include:

```ts
type BulkCreateWorkSchedulesResult = {
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  items: Array<{
    employeeId: string;
    workDate: string;
    status: 'CREATED' | 'SKIPPED' | 'FAILED' | 'REPLACED';
    reason?: string;
    scheduleId?: string;
  }>;
};
```

## 13. APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/work-schedules` | Paginated list with filters. |
| GET | `/work-schedules/calendar` | Week/month calendar data. |
| GET | `/work-schedules/my-schedules` | Schedules for current `user` account's `employeeId`. |
| GET | `/work-schedules/:id` | Schedule details. |
| POST | `/work-schedules` | Create one schedule. |
| POST | `/work-schedules/bulk` | Bulk assignment. |
| PUT | `/work-schedules/:id` | Update schedule. |
| DELETE | `/work-schedules/:id` | Conditional hard delete. |

Query parameters:

```text
fromDate, toDate, branchId, positionId, employeeId, workShiftId, search, page, limit
```

Default sort:

```text
workDate DESC, employee.employeeCode ASC
```

## 14. Database Table

Table: `work_schedules`

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| employee_id | varchar(36) | FK to `employees.id` |
| branch_id | varchar(36) | FK to `branches.id` |
| position_id | varchar(36) | FK to `positions.id` |
| work_shift_id | varchar(36) | FK to `work_shifts.id` |
| work_date | date | Shift start date |
| shift_code_snapshot | varchar(50) | Snapshot |
| shift_name_snapshot | varchar(50) | Current WorkShift name length is 50 |
| start_time_snapshot | time | Snapshot |
| end_time_snapshot | time | Snapshot |
| break_minutes_snapshot | int | Snapshot |
| is_overnight_snapshot | boolean | Snapshot |
| note | text | Nullable |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

Indexes:

```text
UNIQUE (employee_id, work_date)
INDEX employee_id
INDEX branch_id
INDEX position_id
INDEX work_shift_id
INDEX work_date
INDEX (branch_id, work_date)
INDEX (position_id, work_date)
```

## 15. Acceptance Criteria

1. Creating a valid schedule for an active employee with valid branch, position, and work shift succeeds and stores snapshot fields.
2. Creating another schedule for the same employee and same `workDate` is rejected.
3. An overnight shift from the previous day that overlaps the new schedule is rejected.
4. Editing a Work Shift does not change existing Work Schedule snapshots.
5. A schedule with related Attendance or Leave Request cannot be updated or deleted.
6. A `user` role account only receives schedules for its own linked `employeeId`.
7. A manager can only access schedules within allowed branches.
8. Bulk assignment with `SKIP` does not overwrite existing schedules and returns skipped items.
9. Bulk assignment with `REPLACE` overwrites only schedules without related data.

## 16. Suggested Implementation Order

1. Backend entity, migration, and module registration.
2. DTOs for create, update, query, and bulk assignment.
3. Service helpers for date/time calculations and overlap detection.
4. Create schedule API with snapshot and validations.
5. List, detail, calendar, and my-schedules APIs.
6. Update and conditional hard delete APIs.
7. Bulk assignment API.
8. Backend tests for create, overlap, permissions, and bulk behavior.
9. Frontend API client and types.
10. Frontend list view and filters.
11. Frontend create/update dialog.
12. Frontend calendar view.
13. Frontend bulk assignment dialog.
14. Attendance integration later.
