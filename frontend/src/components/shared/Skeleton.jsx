import React from 'react';

/**
 * Skeleton loading placeholders for various UI elements.
 * Usage:
 *   <Skeleton.Card />
 *   <Skeleton.TableRow cols={8} />
 *   <Skeleton.StatCard />
 *   <Skeleton.Text lines={3} />
 */

const Bar = ({ className = '', width = 'w-full' }) => (
  <div className={`h-3 bg-surface-container-highest rounded animate-skeleton-pulse ${width} ${className}`}></div>
);

const Circle = ({ size = 'w-10 h-10', className = '' }) => (
  <div className={`rounded-full bg-surface-container-highest animate-skeleton-pulse ${size} ${className}`}></div>
);

const Card = () => (
  <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] p-6 space-y-4 animate-fade-in">
    <div className="flex items-center gap-3">
      <Circle />
      <div className="flex-1 space-y-2">
        <Bar width="w-1/3" />
        <Bar width="w-1/2" className="h-2" />
      </div>
    </div>
    <Bar />
    <Bar width="w-3/4" />
    <div className="flex gap-4 pt-2">
      <Bar width="w-20" className="h-6 rounded-lg" />
      <Bar width="w-20" className="h-6 rounded-lg" />
    </div>
  </div>
);

const TableRow = ({ cols = 6 }) => (
  <tr className="border-b border-[rgba(73,69,79,0.1)]">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="p-4">
        <Bar width={i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'w-20'} />
      </td>
    ))}
  </tr>
);

const TableSkeleton = ({ rows = 5, cols = 6 }) => (
  <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] p-0 overflow-hidden">
    <table className="w-full">
      <thead className="bg-surface-container">
        <tr className="border-b border-[rgba(73,69,79,0.15)]">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="p-4"><Bar width="w-16" className="h-2" /></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
);

const StatCard = () => (
  <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] p-6 space-y-3">
    <Bar width="w-24" className="h-2" />
    <Bar width="w-16" className="h-8 rounded-lg" />
    <Bar width="w-20" className="h-2" />
  </div>
);

const Text = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Bar key={i} width={i === lines - 1 ? 'w-2/3' : 'w-full'} />
    ))}
  </div>
);

const PageSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="space-y-2">
      <Bar width="w-48" className="h-8" />
      <Bar width="w-64" className="h-3" />
    </div>
    <div className="grid grid-cols-3 gap-6">
      <StatCard />
      <StatCard />
      <StatCard />
    </div>
    <TableSkeleton />
  </div>
);

const Skeleton = {
  Bar,
  Circle,
  Card,
  TableRow,
  TableSkeleton,
  StatCard,
  Text,
  PageSkeleton,
};

export default Skeleton;
