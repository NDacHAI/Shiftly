# Work Schedules Implementation Guide

This guide follows the current Shiftly structure:

```text
backend/src/module/<feature>
frontend/src/features/<feature>
```

## 1. Backend Files To Create

Create a new module:

```text
backend/src/module/work-schedule/
  work-schedule.module.ts
  work-schedule.controller.ts
  work-schedule.service.ts
  dto/
    bulk-create-work-schedules.dto.ts
    create-work-schedule.dto.ts
    update-work-schedule.dto.ts
    work-schedule-query.dto.ts
  entities/
    work-schedule.entity.ts
```

Create a migration:

```text
backend/src/database/migrations/<timestamp>-CreateWorkSchedules.ts
```

Register the module in:

```text
backend/src/app.module.ts
```

## 2. Entity Shape

`WorkSchedule` should use relation ids and relations, matching the current entity style:

```ts
@Entity('work_schedules')
@Index(['employeeId', 'workDate'], { unique: true })
export class WorkSchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_id', type: 'varchar', length: 36 })
  employeeId!: string;

  @ManyToOne(() => Employee, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({ name: 'branch_id', type: 'varchar', length: 36 })
  branchId!: string;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ name: 'position_id', type: 'varchar', length: 36 })
  positionId!: string;

  @ManyToOne(() => Position, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'position_id' })
  position!: Position;

  @Column({ name: 'work_shift_id', type: 'varchar', length: 36 })
  workShiftId!: string;

  @ManyToOne(() => WorkShift, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'work_shift_id' })
  workShift!: WorkShift;

  @Column({ name: 'work_date', type: 'date' })
  workDate!: string;

  @Column({ name: 'shift_code_snapshot', length: 50 })
  shiftCodeSnapshot!: string;

  @Column({ name: 'shift_name_snapshot', length: 50 })
  shiftNameSnapshot!: string;

  @Column({ name: 'start_time_snapshot', type: 'time' })
  startTimeSnapshot!: string;

  @Column({ name: 'end_time_snapshot', type: 'time' })
  endTimeSnapshot!: string;

  @Column({ name: 'break_minutes_snapshot', type: 'int', default: 0 })
  breakMinutesSnapshot!: number;

  @Column({ name: 'is_overnight_snapshot', type: 'boolean', default: false })
  isOvernightSnapshot!: boolean;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

## 3. DTO Rules

Use `class-validator`, like the existing modules:

- `employeeId`, `branchId`, `positionId`, `workShiftId`: `@IsUUID()`
- `workDate`, `startDate`, `endDate`: `@IsDateString()`
- `note`: `@IsOptional()`, `@IsString()`, `@MaxLength(...)`
- `employeeIds`: `@IsArray()`, `@ArrayNotEmpty()`, `@IsUUID('4', { each: true })`
- `weekdays`: optional array of integers from 1 to 7
- `conflictStrategy`: enum `SKIP | REPLACE`

For query DTO, follow the pagination pattern already used in `EmployeeQueryDto` and `WorkShiftQueryDto`.

## 4. Service Dependencies

Inject these repositories:

```ts
@InjectRepository(WorkSchedule)
private readonly workScheduleRepository: Repository<WorkSchedule>,

@InjectRepository(Employee)
private readonly employeeRepository: Repository<Employee>,

@InjectRepository(Branch)
private readonly branchRepository: Repository<Branch>,

@InjectRepository(Position)
private readonly positionRepository: Repository<Position>,

@InjectRepository(WorkShift)
private readonly workShiftRepository: Repository<WorkShift>,
```

Add these entities to `TypeOrmModule.forFeature(...)` in `WorkScheduleModule`.

## 5. Core Service Helpers

Recommended private helpers:

```text
findActiveEmployee(employeeId)
findActiveBranch(branchId)
findActivePosition(positionId)
findActiveWorkShift(workShiftId)
ensureEmployeeCanUseBranch(employee, branchId)
ensureEmployeeCanUsePosition(employee, positionId)
ensurePositionBelongsToBranch(position, branchId)
ensureWorkDateAfterHireDate(employee, workDate)
ensureNoSameDaySchedule(employeeId, workDate, excludeScheduleId?)
ensureNoOverlap(employeeId, workDate, shiftSnapshot, excludeScheduleId?)
buildShiftSnapshot(workShift)
toScheduleInterval(workDate, startTime, endTime)
calculateWorkingDurationMinutes(schedule)
```

Keep the Attendance/Leave Request protection as one method for now:

```ts
private async ensureScheduleHasNoLockedRelatedData(scheduleId: string): Promise<void> {
  // TODO: Extend when Attendance and Leave Request modules are implemented.
}
```

## 6. Overlap Detection Approach

Convert each schedule to a real interval:

```text
start = workDate + startTime
end = workDate + endTime
if end <= start, add 1 day to end
```

To check a new schedule, compare it with schedules for the same employee around the target date:

```text
existing.start < candidate.end AND candidate.start < existing.end
```

Because overnight shifts can cross midnight, query at least:

```text
workDate between candidateDate - 1 day and candidateDate + 1 day
```

The unique index `(employee_id, work_date)` still catches same-day duplicates, but overlap validation catches cross-day conflicts.

## 7. Controller Permissions

Use the same guard pattern as current modules:

```ts
@Controller('work-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Manager, UserRole.User)
export class WorkScheduleController {}
```

Recommended endpoint permissions:

| Endpoint | Roles |
| --- | --- |
| `GET /work-schedules` | admin, manager |
| `GET /work-schedules/calendar` | admin, manager |
| `GET /work-schedules/my-schedules` | user, manager, admin if linked employee is allowed |
| `GET /work-schedules/:id` | admin, manager scoped, owner user |
| `POST /work-schedules` | admin, manager scoped |
| `POST /work-schedules/bulk` | admin, manager scoped |
| `PUT /work-schedules/:id` | admin, manager scoped |
| `DELETE /work-schedules/:id` | admin, manager scoped |

For manager scope, reuse the existing pattern:

```ts
const allowedBranchIds = await employeeService.findManagedBranchIds(request.user.sub);
```

## 8. App Module Registration

After creating `WorkScheduleModule`, add it to:

```ts
imports: [
  ...
  WorkScheduleModule,
]
```

## 9. Backend Test Checklist

Add service/controller tests for:

- Create valid schedule stores snapshot.
- Inactive employee/branch/position/work shift rejected.
- Position from another branch rejected.
- Employee not assigned to branch rejected.
- Employee not assigned to position rejected.
- `workDate < hireDate` rejected.
- Same employee and same `workDate` rejected.
- Previous overnight shift overlap rejected.
- Updating Work Shift does not mutate existing schedule snapshot.
- User can only access own schedule.
- Manager only accesses allowed branch schedules.
- Bulk `SKIP` returns skipped records.
- Bulk `REPLACE` replaces unlocked records.

## 10. Frontend Files To Create

Create:

```text
frontend/src/features/work-schedules/
  api/work-schedules.api.ts
  types.ts
  pages/WorkSchedulesPage.tsx
  components/WorkScheduleFormDialog.tsx
  components/WorkScheduleDetailsDialog.tsx
  components/WorkScheduleCalendar.tsx
  components/BulkAssignSchedulesDialog.tsx
```

Update:

```text
frontend/src/app/router/index.tsx
frontend/src/components/layout/Nav.tsx
frontend/src/i18n/locales/vi.ts
frontend/src/i18n/locales/en.ts
```

## 11. Frontend Implementation Order

1. Add TypeScript types matching backend responses.
2. Add API functions for list, detail, create, update, delete, bulk, calendar, and my-schedules.
3. Add route `/work-schedules`.
4. Add navigation item.
5. Build list view first with filters.
6. Add create/update dialog.
7. Add details dialog.
8. Add calendar view.
9. Add bulk assign dialog.
10. Add permission-based action visibility.

## 12. Suggested Backend Order To Code

Use this exact order when implementing:

1. Migration.
2. Entity.
3. DTOs.
4. Module.
5. Basic service with create and findOne.
6. Controller create and detail endpoint.
7. Validation helpers.
8. Overlap helper.
9. List/calendar/my-schedules.
10. Update/delete.
11. Bulk assign.
12. Tests.
