import { DefaultNamingStrategy, Table, View } from 'typeorm';

type TableName = Table | View | string;

const indexNames = new Map<string, string>([
    ['departments:code', 'IDX_departments_code'],
    ['departments:name', 'IDX_departments_name'],
    ['positions:code', 'IDX_positions_code'],
    ['positions:department_id', 'IDX_positions_department_id'],
    ['positions:status', 'IDX_positions_status'],
    ['employees:employee_code', 'IDX_employees_employee_code'],
    ['employees:email', 'IDX_employees_email'],
    ['employees:status', 'IDX_employees_status'],
    ['users:employee_id', 'IDX_users_employee_id'],
    ['work_shifts:code', 'IDX_work_shifts_code'],
    ['work_shifts:name', 'IDX_work_shifts_name'],
]);

const foreignKeyNames = new Map<string, string>([
    ['positions:department_id:departments', 'FK_positions_department'],
    ['users:employee_id:employees', 'FK_users_employee'],
    [
        'employee_departments:employee_id:employees',
        'FK_employee_departments_employee',
    ],
    [
        'employee_departments:department_id:departments',
        'FK_employee_departments_department',
    ],
    [
        'employee_positions:employee_id:employees',
        'FK_employee_positions_employee',
    ],
    [
        'employee_positions:position_id:positions',
        'FK_employee_positions_position',
    ],
]);

export class LegacyNamingStrategy extends DefaultNamingStrategy {
    private tableNameOf(tableOrName: TableName): string {
        return typeof tableOrName === 'string'
            ? tableOrName
            : tableOrName.name;
    }

    private indexKey(tableOrName: TableName, columnNames: string[]): string {
        return `${this.tableNameOf(tableOrName)}:${columnNames.join(',')}`;
    }

    indexName(tableOrName: TableName, columnNames: string[]): string {
        return (
            indexNames.get(this.indexKey(tableOrName, columnNames)) ??
            super.indexName(this.tableNameOf(tableOrName), columnNames)
        );
    }

    uniqueConstraintName(tableOrName: TableName, columnNames: string[]): string {
        return (
            indexNames.get(this.indexKey(tableOrName, columnNames)) ??
            super.uniqueConstraintName(this.tableNameOf(tableOrName), columnNames)
        );
    }

    relationConstraintName(
        tableOrName: TableName,
        columnNames: string[],
    ): string {
        return (
            indexNames.get(this.indexKey(tableOrName, columnNames)) ??
            super.relationConstraintName(
                this.tableNameOf(tableOrName),
                columnNames,
            )
        );
    }

    foreignKeyName(
        tableOrName: TableName,
        columnNames: string[],
        referencedTablePath?: string,
        referencedColumnNames?: string[],
    ): string {
        const key = `${this.tableNameOf(tableOrName)}:${columnNames.join(
            ',',
        )}:${referencedTablePath ?? ''}`;

        return (
            foreignKeyNames.get(key) ??
            super.foreignKeyName(
                this.tableNameOf(tableOrName),
                columnNames,
                referencedTablePath,
                referencedColumnNames,
            )
        );
    }
}
