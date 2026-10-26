import React from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, total, limit, onPageChange }) => {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build page numbers: always show first, last, current ±1, with ellipsis
  const pages: (number | '...')[] = [];
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };

  add(1);
  if (page > 3) pages.push('...');
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i);
  if (page < totalPages - 2) pages.push('...');
  if (totalPages > 1) add(totalPages);

  return (
    <div className="pagination-wrap">
      <span className="pagination-info">
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> records
      </span>
      <div className="pagination-controls">
        <button
          className="pg-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          title="Previous"
        >
          <MdChevronLeft size={18} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="pg-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`pg-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="pg-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Next"
        >
          <MdChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
