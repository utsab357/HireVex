import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState — Reusable empty state component.
 * @param {React.ReactNode} [icon] - Custom icon (defaults to Inbox)
 * @param {string} title - Title text
 * @param {string} [description] - Description text
 * @param {React.ReactNode} [action] - Optional action button/link
 */
const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[rgba(73,69,79,0.2)] rounded-2xl text-center animate-fade-in">
    <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-4">
      {icon || <Inbox size={32} />}
    </div>
    <h3 className="text-xl font-semibold text-on-surface mb-2">{title}</h3>
    {description && <p className="text-sm text-on-surface-variant mb-6 max-w-sm">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
