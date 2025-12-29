'use client';

import { ProjectStats } from '../types';

interface KpiPanelProps {
  stats: ProjectStats;
  variant?: 'compact' | 'full';
}

/**
 * 5-column KPI stats grid
 * - compact: smaller for preview panel (default)
 * - full: larger for header stats row
 */
export default function KpiPanel({ stats, variant = 'compact' }: KpiPanelProps) {
  if (variant === 'full') {
    return (
      <div className="grid grid-cols-5 gap-3">
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
          <span className="text-sm text-gray-400">Todos</span>
          <span className="text-xl font-bold text-blue-400">{stats.todos}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
          <span className="text-sm text-gray-400">Knowledge</span>
          <span className="text-xl font-bold text-purple-400">{stats.knowledge}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
          <span className="text-sm text-gray-400">Docs</span>
          <span className="text-xl font-bold text-green-400">{stats.docs}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
          <span className="text-sm text-gray-400">Conventions</span>
          <span className="text-xl font-bold text-yellow-400">{stats.conventions}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
          <span className="text-sm text-gray-400">Bugs</span>
          <span className="text-xl font-bold text-red-400">{stats.bugs}</span>
        </div>
      </div>
    );
  }

  // Compact variant for preview panel
  return (
    <div className="grid grid-cols-5 gap-2">
      <div className="text-center p-2 bg-gray-900 rounded">
        <div className="text-lg font-bold text-blue-400">{stats.todos}</div>
        <div className="text-[10px] text-gray-500">Todos</div>
      </div>
      <div className="text-center p-2 bg-gray-900 rounded">
        <div className="text-lg font-bold text-purple-400">{stats.knowledge}</div>
        <div className="text-[10px] text-gray-500">Know</div>
      </div>
      <div className="text-center p-2 bg-gray-900 rounded">
        <div className="text-lg font-bold text-green-400">{stats.docs}</div>
        <div className="text-[10px] text-gray-500">Docs</div>
      </div>
      <div className="text-center p-2 bg-gray-900 rounded">
        <div className="text-lg font-bold text-yellow-400">{stats.conventions}</div>
        <div className="text-[10px] text-gray-500">Conv</div>
      </div>
      <div className="text-center p-2 bg-gray-900 rounded">
        <div className="text-lg font-bold text-red-400">{stats.bugs}</div>
        <div className="text-[10px] text-gray-500">Bugs</div>
      </div>
    </div>
  );
}
