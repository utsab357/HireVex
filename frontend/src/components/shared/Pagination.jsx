import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination — Reusable pagination component.
 * @param {number} page - Current page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalCount - Total number of items
 * @param {number} showing - Number of items currently showing
 * @param {function} onPageChange - Callback (newPage) => void
 * @param {number} [pageSize] - Optional current page size
 * @param {function} [onPageSizeChange] - Optional callback (newSize) => void
 */
const Pagination = ({ page, totalPages, totalCount, showing, onPageChange, pageSize, onPageSizeChange }) => {
  return (
    <div className="p-3 border-t border-[rgba(73,69,79,0.15)] flex justify-between items-center text-xs text-on-surface-variant bg-surface-container">
      <span>Showing {showing} of {totalCount} items</span>
      <div className="flex gap-2 items-center">
        {onPageSizeChange && (
          <select
            value={pageSize || 20}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="input-field py-1 text-xs h-7 bg-surface-container-high w-20"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        )}
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1 rounded bg-surface-container-high hover:bg-primary/20 hover:text-primary disabled:opacity-50 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-semibold">Page {page} of {totalPages || 1}</span>
        <button
          disabled={page >= totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          className="p-1 rounded bg-surface-container-high hover:bg-primary/20 hover:text-primary disabled:opacity-50 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
