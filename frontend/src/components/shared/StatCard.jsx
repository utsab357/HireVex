import React from 'react';

/**
 * StatCard — Reusable stat/metric card component.
 * @param {React.ReactNode} icon - Lucide icon element
 * @param {string|number} value - Main metric value
 * @param {string} label - Description label
 * @param {string} [trend] - Optional trend text (e.g., "+12%")
 * @param {'up'|'down'|'neutral'} [trendDirection='neutral'] - Trend direction for coloring
 * @param {string} [className] - Additional classes
 */
const StatCard = ({ icon, value, label, trend, trendDirection = 'neutral', className = '' }) => {
  const trendColor = trendDirection === 'up' ? 'text-status-success' :
                     trendDirection === 'down' ? 'text-status-error' :
                     'text-on-surface-variant';

  return (
    <div className={`card glass-card ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${trendColor}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-on-surface mb-1">{value}</div>
      <div className="text-xs text-on-surface-variant uppercase tracking-wider">{label}</div>
    </div>
  );
};

export default StatCard;
