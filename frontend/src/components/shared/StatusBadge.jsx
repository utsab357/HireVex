import React from 'react';

const STATUS_STYLES = {
  new: { label: 'Applied', bg: 'bg-surface-container-highest', text: 'text-on-surface-variant' },
  review: { label: 'Review', bg: 'bg-status-warning/15', text: 'text-status-warning' },
  shortlisted: { label: 'Shortlisted', bg: 'bg-status-success/15', text: 'text-status-success' },
  interview: { label: 'Interview', bg: 'bg-primary/15', text: 'text-primary' },
  on_hold: { label: 'On Hold', bg: 'bg-tertiary/15', text: 'text-tertiary' },
  offer: { label: 'Offered', bg: 'bg-status-info/15', text: 'text-status-info' },
  hired: { label: 'Hired', bg: 'bg-status-success/15', text: 'text-status-success' },
  rejected: { label: 'Rejected', bg: 'bg-status-error/15', text: 'text-status-error' },
  // Job statuses
  active: { label: 'Active', bg: 'bg-status-success/15', text: 'text-status-success' },
  paused: { label: 'Paused', bg: 'bg-status-warning/15', text: 'text-status-warning' },
  closed: { label: 'Closed', bg: 'bg-surface-container-highest', text: 'text-on-surface-variant' },
  draft: { label: 'Draft', bg: 'bg-surface-container-highest', text: 'text-on-surface-variant' },
  // Confidence
  high: { label: 'High', bg: 'bg-status-success/15', text: 'text-status-success' },
  medium: { label: 'Medium', bg: 'bg-status-warning/15', text: 'text-status-warning' },
  low: { label: 'Low', bg: 'bg-status-error/15', text: 'text-status-error' },
};

/**
 * StatusBadge — Reusable status badge component.
 * @param {string} status - The status key (e.g., 'new', 'shortlisted', 'rejected')
 * @param {string} [className] - Additional classes
 * @param {string} [size='sm'] - Size variant: 'sm' or 'xs'
 */
const StatusBadge = ({ status, className = '', size = 'sm' }) => {
  const style = STATUS_STYLES[status] || { label: status, bg: 'bg-surface-container-highest', text: 'text-on-surface-variant' };
  const sizeClass = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]';

  return (
    <span className={`${style.bg} ${style.text} ${sizeClass} rounded font-bold uppercase tracking-wider inline-block ${className}`}>
      {style.label}
    </span>
  );
};

export default StatusBadge;
export { STATUS_STYLES };
