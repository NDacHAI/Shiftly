import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/feedback';
import { routes } from '@/constants/routes';
import {
    confirmAttendance,
    getAttendanceErrorKey,
} from '@/features/attendance/api/attendance.api';
import {
    approveLeaveRequest,
    getLeaveRequestErrorKey,
    rejectLeaveRequest,
} from '@/features/leave-requests/api/leave-requests.api';
import {
    approveShiftRequest,
    getShiftRequestErrorKey,
    rejectShiftRequest,
} from '@/features/shift-requests/api/shift-requests.api';
import { type I18nKey, useI18n } from '@/i18n';
import {
    formatHours,
    formatShortDate,
    initialsOf,
    interpolate,
} from '../lib/format';
import { type DashboardSummary } from '../types';
import { DashboardCard } from './DashboardCard';

type QueueType = 'leave' | 'shift' | 'attendance';
type QueueTab = 'all' | QueueType;
type ReviewAction = 'approve' | 'reject';

type QueueItem = {
    id: string;
    type: QueueType;
    name: string;
    detail: string;
    meta: string;
};

const tagClasses: Record<QueueType, string> = {
    leave: 'bg-[#ece6f7] text-[#4b3a7a]',
    shift: 'bg-ember-tint text-ember-ink',
    attendance: 'bg-[#dff0e4] text-[#1f6237]',
};

const typeLabelKeys: Record<QueueType, I18nKey> = {
    leave: 'dashboard.queue.leave',
    shift: 'dashboard.queue.shift',
    attendance: 'dashboard.queue.attendance',
};

const typeRoutes: Record<QueueType, string> = {
    leave: routes.leaveRequests,
    shift: routes.shiftRequests,
    attendance: routes.attendance,
};

type ApprovalQueueProps = {
    summary: DashboardSummary;
    onChanged: () => void;
};

export function ApprovalQueue({ summary, onChanged }: ApprovalQueueProps) {
    const { language, t } = useI18n();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<QueueTab>('all');
    const [review, setReview] = useState<{ id: string; action: ReviewAction } | null>(
        null,
    );
    const [note, setNote] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { actionItems, pending } = summary;

    const items: QueueItem[] = [
        ...actionItems.pendingShiftRequests.map((request) => ({
            id: request.id,
            type: 'shift' as const,
            name: request.employeeName,
            detail: interpolate(t('dashboard.queue.shiftDetail'), {
                shift: request.shiftName,
            }),
            meta: `${formatShortDate(request.workDate, language)} · ${request.branchName}`,
        })),
        ...actionItems.pendingLeaveRequests.map((request) => {
            const dates =
                request.startDate && request.endDate && request.startDate !== request.endDate
                    ? `${formatShortDate(request.startDate, language)} – ${formatShortDate(request.endDate, language)}`
                    : request.startDate
                      ? formatShortDate(request.startDate, language)
                      : '';
            const hours =
                request.isFullDay === false && request.startTime && request.endTime
                    ? ` ${request.startTime.slice(0, 5)}–${request.endTime.slice(0, 5)}`
                    : '';

            return {
                id: request.id,
                type: 'leave' as const,
                name: request.employeeName,
                detail: interpolate(t('dashboard.queue.leaveDetail'), {
                    code: request.code,
                }),
                meta: [`${dates}${hours}`, request.branchName].filter(Boolean).join(' · '),
            };
        }),
        ...actionItems.pendingAttendances.map((attendance) => ({
            id: attendance.id,
            type: 'attendance' as const,
            name: attendance.employeeName,
            detail: interpolate(t('dashboard.queue.attendanceDetail'), {
                hours: formatHours(attendance.workedMinutes, language),
            }),
            meta: [
                formatShortDate(attendance.scheduleDate, language),
                attendance.branchName,
                attendance.lateMinutes > 0
                    ? interpolate(t('dashboard.queue.lateMeta'), {
                          minutes: attendance.lateMinutes,
                      })
                    : '',
            ]
                .filter(Boolean)
                .join(' · '),
        })),
    ];

    const counts: Record<QueueTab, number> = {
        all: pending.total,
        leave: pending.leaveRequests,
        shift: pending.shiftRequests,
        attendance: pending.attendanceConfirmations,
    };
    const tabs: Array<{ key: QueueTab; label: string }> = [
        { key: 'all', label: t('dashboard.queue.all') },
        { key: 'leave', label: t('dashboard.queue.leave') },
        { key: 'shift', label: t('dashboard.queue.shift') },
        { key: 'attendance', label: t('dashboard.queue.attendance') },
    ];
    const visibleItems = items.filter(
        (item) => activeTab === 'all' || item.type === activeTab,
    );

    async function runAction(
        item: QueueItem,
        action: () => Promise<unknown>,
        successKey: I18nKey,
        errorKeyOf: (error: unknown) => I18nKey,
    ) {
        setProcessingId(item.id);

        try {
            await action();
            showToast({
                title: t('common.success'),
                message: interpolate(t(successKey), { name: item.name }),
                variant: 'success',
            });
            setReview(null);
            setNote('');
            onChanged();
        } catch (actionError) {
            showToast({
                title: t('dashboard.queue.actionError'),
                message: t(errorKeyOf(actionError)),
                variant: 'error',
            });
        } finally {
            setProcessingId(null);
        }
    }

    function reviewShift(item: QueueItem, action: ReviewAction) {
        void runAction(
            item,
            () =>
                action === 'approve'
                    ? approveShiftRequest(item.id, {})
                    : rejectShiftRequest(item.id, {}),
            action === 'approve' ? 'dashboard.queue.approved' : 'dashboard.queue.rejected',
            getShiftRequestErrorKey,
        );
    }

    // Leave decisions require a review note, so they open an inline note field first.
    function submitLeaveReview(item: QueueItem, action: ReviewAction) {
        const payload = { reviewNote: note.trim() };

        void runAction(
            item,
            () =>
                action === 'approve'
                    ? approveLeaveRequest(item.id, payload)
                    : rejectLeaveRequest(item.id, payload),
            action === 'approve' ? 'dashboard.queue.approved' : 'dashboard.queue.rejected',
            getLeaveRequestErrorKey,
        );
    }

    function startLeaveReview(item: QueueItem, action: ReviewAction) {
        setReview({ id: item.id, action });
        setNote('');
    }

    const primaryButton =
        'min-h-0 cursor-pointer rounded-md border-0 bg-ink px-3 py-1.5 text-xs font-medium text-sand hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50';
    const secondaryButton =
        'min-h-0 cursor-pointer rounded-md border border-rule-strong bg-transparent px-3 py-1.5 text-xs font-medium text-ink hover:bg-stone-soft disabled:cursor-not-allowed disabled:opacity-50';

    return (
        <DashboardCard
            action={
                <span className="text-[13px] text-muted">
                    {interpolate(t('dashboard.queue.count'), { count: pending.total })}
                </span>
            }
            className="flex-[1_1_340px]"
            flush
            title={t('dashboard.queue.title')}
        >
            <div className="flex flex-col gap-3.5">
                <div
                    aria-label={t('dashboard.queue.title')}
                    className="flex flex-wrap gap-1.5 px-6 max-sm:px-4"
                    role="tablist"
                >
                    {tabs.map((tab) => {
                        const isActive = tab.key === activeTab;

                        return (
                            <button
                                aria-selected={isActive}
                                className={`flex min-h-0 cursor-pointer gap-1.5 rounded-full border px-[11px] py-[5px] text-xs font-medium ${
                                    isActive
                                        ? 'border-ink bg-ink text-sand'
                                        : 'border-rule-strong bg-transparent text-ink hover:bg-stone-soft'
                                }`}
                                key={tab.key}
                                role="tab"
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                                <span className="opacity-70">{counts[tab.key]}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex max-h-[390px] flex-col overflow-y-auto" role="tabpanel">
                    {visibleItems.length === 0 ? (
                        <div className="flex flex-col gap-1 border-t border-rule-soft px-6 py-10 text-center">
                            <span className="text-[15px] font-semibold text-ink">
                                {t('dashboard.queue.emptyTitle')}
                            </span>
                            <span className="text-[13px] text-muted">
                                {t('dashboard.queue.emptyDescription')}
                            </span>
                        </div>
                    ) : (
                        visibleItems.map((item) => {
                            const busy = processingId === item.id;
                            const reviewing = review?.id === item.id ? review : null;

                            return (
                                <div
                                    className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 border-t border-rule-soft px-6 py-3.5 max-sm:px-4"
                                    key={`${item.type}-${item.id}`}
                                >
                                    <div className="grid size-9 place-items-center rounded-full bg-stone text-xs font-semibold text-ink">
                                        {initialsOf(item.name)}
                                    </div>
                                    <div className="flex min-w-0 flex-col gap-2">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-ink">
                                                    {item.name}
                                                </span>
                                                <span
                                                    className={`rounded px-[7px] py-px text-[11px] font-semibold ${tagClasses[item.type]}`}
                                                >
                                                    {t(typeLabelKeys[item.type])}
                                                </span>
                                            </div>
                                            <span className="text-[13px] text-ink">{item.detail}</span>
                                            {item.meta && (
                                                <span className="text-xs text-muted">{item.meta}</span>
                                            )}
                                        </div>

                                        {reviewing ? (
                                            <div className="flex flex-col gap-2">
                                                <textarea
                                                    aria-label={t('dashboard.queue.notePlaceholder')}
                                                    className="min-h-16 w-full resize-y rounded-md border border-rule-strong bg-paper px-2.5 py-2 text-[13px] text-ink outline-none focus:border-ink"
                                                    placeholder={t('dashboard.queue.notePlaceholder')}
                                                    value={note}
                                                    onChange={(event) => setNote(event.target.value)}
                                                />
                                                <div className="flex gap-1.5">
                                                    <button
                                                        className={primaryButton}
                                                        disabled={busy || note.trim() === ''}
                                                        type="button"
                                                        onClick={() =>
                                                            submitLeaveReview(item, reviewing.action)
                                                        }
                                                    >
                                                        {reviewing.action === 'approve'
                                                            ? t('dashboard.queue.approve')
                                                            : t('dashboard.queue.reject')}
                                                    </button>
                                                    <button
                                                        className={secondaryButton}
                                                        disabled={busy}
                                                        type="button"
                                                        onClick={() => setReview(null)}
                                                    >
                                                        {t('common.cancel')}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1.5">
                                                {item.type === 'attendance' ? (
                                                    <>
                                                        <button
                                                            className={primaryButton}
                                                            disabled={busy}
                                                            type="button"
                                                            onClick={() =>
                                                                void runAction(
                                                                    item,
                                                                    () => confirmAttendance(item.id),
                                                                    'dashboard.queue.confirmed',
                                                                    getAttendanceErrorKey,
                                                                )
                                                            }
                                                        >
                                                            {t('dashboard.queue.confirm')}
                                                        </button>
                                                        <Link
                                                            className={`${secondaryButton} no-underline`}
                                                            to={routes.attendance}
                                                        >
                                                            {t('dashboard.queue.details')}
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className={primaryButton}
                                                            disabled={busy}
                                                            type="button"
                                                            onClick={() =>
                                                                item.type === 'leave'
                                                                    ? startLeaveReview(item, 'approve')
                                                                    : reviewShift(item, 'approve')
                                                            }
                                                        >
                                                            {t('dashboard.queue.approve')}
                                                        </button>
                                                        <button
                                                            className={secondaryButton}
                                                            disabled={busy}
                                                            type="button"
                                                            onClick={() =>
                                                                item.type === 'leave'
                                                                    ? startLeaveReview(item, 'reject')
                                                                    : reviewShift(item, 'reject')
                                                            }
                                                        >
                                                            {t('dashboard.queue.reject')}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {activeTab !== 'all' && counts[activeTab] > visibleItems.length && (
                    <Link
                        className="border-t border-rule-soft px-6 pt-3 pb-1.5 text-[13px] font-medium text-ink hover:text-ember-strong"
                        to={typeRoutes[activeTab]}
                    >
                        {t('dashboard.queue.more')} →
                    </Link>
                )}
            </div>
        </DashboardCard>
    );
}
