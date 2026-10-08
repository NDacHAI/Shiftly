import { useState } from 'react';
import { Link } from 'react-router-dom';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EmptyState } from '@/components/ui';
import { routes } from '@/constants/routes';
import { type I18nKey, useI18n } from '@/i18n';
import {
    formatHours,
    formatShortDate,
    formatTime,
    interpolate,
} from '../lib/format';
import { type DashboardSummary } from '../types';
import { DashboardCard } from './DashboardCard';

type ActionTab = 'missingCheckIns' | 'leaveRequests' | 'shiftRequests' | 'attendances';

type ActionItemsPanelProps = {
    summary: DashboardSummary;
};

type ActionRow = {
    id: string;
    title: string;
    subtitle: string;
    meta: string;
    tone: 'danger' | 'warning' | 'neutral';
};

const metaToneClasses: Record<ActionRow['tone'], string> = {
    danger: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-700',
    neutral: 'bg-slate-100 text-slate-600',
};

export function ActionItemsPanel({ summary }: ActionItemsPanelProps) {
    const { language, t } = useI18n();
    const [activeTab, setActiveTab] = useState<ActionTab>('missingCheckIns');
    const { actionItems, pending } = summary;

    const tabs: Array<{
        key: ActionTab;
        labelKey: I18nKey;
        count: number;
        href: string;
    }> = [
        {
            key: 'missingCheckIns',
            labelKey: 'dashboard.actions.missingCheckIns',
            count: actionItems.missingCheckIns.length,
            href: routes.attendance,
        },
        {
            key: 'leaveRequests',
            labelKey: 'dashboard.actions.leaveRequests',
            count: pending.leaveRequests,
            href: routes.leaveRequests,
        },
        {
            key: 'shiftRequests',
            labelKey: 'dashboard.actions.shiftRequests',
            count: pending.shiftRequests,
            href: routes.shiftRequests,
        },
        {
            key: 'attendances',
            labelKey: 'dashboard.actions.attendances',
            count: pending.attendanceConfirmations,
            href: routes.attendance,
        },
    ];

    function buildRows(tab: ActionTab): ActionRow[] {
        switch (tab) {
            case 'missingCheckIns':
                return actionItems.missingCheckIns.map((item) => ({
                    id: item.workScheduleId,
                    title: `${item.employeeCode} - ${item.employeeName}`,
                    subtitle: `${item.shiftName} · ${item.branchName} · ${formatTime(item.scheduledStartAt, language)}`,
                    meta: interpolate(t('dashboard.actions.minutesOverdue'), {
                        minutes: item.minutesOverdue,
                    }),
                    tone: 'danger',
                }));
            case 'leaveRequests':
                return actionItems.pendingLeaveRequests.map((item) => {
                    const dateText =
                        item.startDate && item.endDate && item.startDate !== item.endDate
                            ? `${formatShortDate(item.startDate, language)} - ${formatShortDate(item.endDate, language)}`
                            : item.startDate
                              ? formatShortDate(item.startDate, language)
                              : '';

                    return {
                        id: item.id,
                        title: item.employeeName,
                        subtitle: `${item.code} · ${item.branchName}`,
                        meta: dateText,
                        tone: 'warning',
                    };
                });
            case 'shiftRequests':
                return actionItems.pendingShiftRequests.map((item) => ({
                    id: item.id,
                    title: item.employeeName,
                    subtitle: `${item.shiftName} · ${item.branchName}`,
                    meta: formatShortDate(item.workDate, language),
                    tone: 'warning',
                }));
            case 'attendances':
                return actionItems.pendingAttendances.map((item) => ({
                    id: item.id,
                    title: item.employeeName,
                    subtitle: `${formatShortDate(item.scheduleDate, language)} · ${item.branchName}`,
                    meta: `${formatHours(item.workedMinutes, language)} ${t('dashboard.common.hoursUnit')}`,
                    tone: 'neutral',
                }));
        }
    }

    const currentTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
    const rows = buildRows(currentTab.key);

    return (
        <DashboardCard
            action={
                <Link
                    className="rounded-md px-2 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50"
                    to={currentTab.href}
                >
                    {t('dashboard.common.viewAll')}
                </Link>
            }
            className="xl:col-span-2"
            description={t('dashboard.actions.description')}
            title={t('dashboard.actions.title')}
        >
            <div
                aria-label={t('dashboard.actions.title')}
                className="mb-4 flex flex-wrap gap-2"
                role="tablist"
            >
                {tabs.map((tab) => {
                    const isActive = tab.key === activeTab;

                    return (
                        <button
                            aria-selected={isActive}
                            className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                                isActive
                                    ? 'border-primary-200 bg-primary-50 text-primary-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                            key={tab.key}
                            role="tab"
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {t(tab.labelKey)}
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                    tab.count > 0
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-slate-100 text-slate-500'
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {rows.length === 0 ? (
                <EmptyState
                    description={t('dashboard.actions.emptyDescription')}
                    icon={<FontAwesomeIcon icon={faCircleCheck} />}
                    title={t('dashboard.actions.emptyTitle')}
                />
            ) : (
                <ul className="divide-y divide-slate-100" role="tabpanel">
                    {rows.map((row) => (
                        <li
                            className="flex items-center justify-between gap-3 py-3"
                            key={row.id}
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                    {row.title}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                    {row.subtitle}
                                </p>
                            </div>
                            {row.meta && (
                                <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${metaToneClasses[row.tone]}`}
                                >
                                    {row.meta}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </DashboardCard>
    );
}
