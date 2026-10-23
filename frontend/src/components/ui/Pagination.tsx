import {
    faChevronLeft,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const pagerButtonClass =
    'grid size-8 min-h-0 cursor-pointer place-items-center rounded-md border border-rule-strong bg-transparent text-xs text-ink transition-colors hover:bg-stone-soft disabled:cursor-default disabled:text-[#b9b3a4] disabled:hover:bg-transparent';

type PaginationProps = {
    page: number;
    pageSize: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

export function Pagination({
    page,
    pageSize,
    totalPages,
    onPageChange,
}: PaginationProps) {
    const displayedPage = totalPages === 0 ? 0 : page;

    return (
        <div className="flex items-center justify-between gap-4 border-t border-rule px-5 py-3 text-[13px] text-muted max-sm:flex-col max-sm:px-4">
            <span>Hiển thị {pageSize} trên mỗi trang</span>
            <div className="flex items-center gap-1.5">
                <button
                    aria-label="Trang trước"
                    className={pagerButtonClass}
                    disabled={page <= 1 || totalPages === 0}
                    type="button"
                    onClick={() => onPageChange(page - 1)}
                >
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <span className="grid size-8 place-items-center rounded-md bg-ink text-[13px] font-semibold text-sand">
                    {displayedPage}
                </span>
                <button
                    aria-label="Trang sau"
                    className={pagerButtonClass}
                    disabled={page >= totalPages || totalPages === 0}
                    type="button"
                    onClick={() => onPageChange(page + 1)}
                >
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>
                <span className="pl-2 tabular-nums text-xs">
                    Trang {displayedPage} / {totalPages}
                </span>
            </div>
        </div>
    );
}
