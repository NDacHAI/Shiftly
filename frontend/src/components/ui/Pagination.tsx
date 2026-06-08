import {
    faChevronLeft,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from './Button';

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
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 max-sm:flex-col">
            <span>Hiển thị {pageSize} trên mỗi trang</span>
            <div className="flex items-center gap-2">
                <Button
                    aria-label="Trang trước"
                    disabled={page <= 1 || totalPages === 0}
                    onClick={() => onPageChange(page - 1)}
                    size="icon"
                    variant="secondary"
                >
                    <FontAwesomeIcon icon={faChevronLeft} />
                </Button>
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-600 font-semibold text-white">
                    {displayedPage}
                </span>
                <Button
                    aria-label="Trang sau"
                    disabled={page >= totalPages || totalPages === 0}
                    onClick={() => onPageChange(page + 1)}
                    size="icon"
                    variant="secondary"
                >
                    <FontAwesomeIcon icon={faChevronRight} />
                </Button>
                <span className="ml-3">
                    Trang {displayedPage} / {totalPages}
                </span>
            </div>
        </div>
    );
}
