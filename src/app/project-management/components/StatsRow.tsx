'use client';

import { ProjectStats } from '../types';

interface StatsRowProps {
  stats: ProjectStats;
  size?: 'sm' | 'md';
}

/**
 * Inline stats display: Todos 5 Bugs 19 Knowledge 3 Structure 110
 * Used under project names in the project list
 */
export default function StatsRow({ stats, size = 'sm' }: StatsRowProps) {
  const hasAny = stats.todos || stats.knowledge || stats.docs || stats.conventions || stats.bugs;

  if (!hasAny) return null;

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={`flex items-center gap-3 ${textSize}`}>
      {stats.todos > 0 && (
        <span className="text-blue-400">
          Todos <span className="font-medium">{stats.todos}</span>
        </span>
      )}
      {stats.bugs > 0 && (
        <span className="text-red-400">
          Bugs <span className="font-medium">{stats.bugs}</span>
        </span>
      )}
      {stats.knowledge > 0 && (
        <span className="text-green-400">
          Knowledge <span className="font-medium">{stats.knowledge}</span>
        </span>
      )}
      {stats.docs > 0 && (
        <span className="text-cyan-400">
          Docs <span className="font-medium">{stats.docs}</span>
        </span>
      )}
      {stats.conventions > 0 && (
        <span className="text-purple-400">
          Structure <span className="font-medium">{stats.conventions}</span>
        </span>
      )}
    </div>
  );
}
