'use client';

import { PipelineStats } from '../lib/types';

interface StudioStatsPanelProps {
  stats: PipelineStats | null;
  loading?: boolean;
}

interface StatItem {
  label: string;
  value: number;
  color: string;
  icon: string;
}

export default function StudioStatsPanel({ stats, loading }: StudioStatsPanelProps) {
  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Today's Pipeline</h3>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-6 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const statItems: StatItem[] = [
    { label: 'Context Flips', value: stats?.flips || 0, color: 'text-blue-400', icon: '🔄' },
    { label: 'Heartbeats', value: stats?.heartbeats || 0, color: 'text-green-400', icon: '💓' },
    { label: 'Transcripts', value: stats?.transcripts || 0, color: 'text-purple-400', icon: '📝' },
    { label: 'Sessions', value: stats?.sessions || 0, color: 'text-cyan-400', icon: '📦' },
    { label: 'Worklogs', value: stats?.worklogs || 0, color: 'text-yellow-400', icon: '📋' },
    { label: 'Todos', value: stats?.todos || 0, color: 'text-orange-400', icon: '✅' },
    { label: 'Bugs', value: stats?.bugs || 0, color: 'text-red-400', icon: '🐛' },
    { label: 'Knowledge', value: stats?.knowledge || 0, color: 'text-pink-400', icon: '🧠' },
  ];

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Today's Pipeline</h3>
      <div className="grid grid-cols-2 gap-2">
        {statItems.map(item => (
          <div
            key={item.label}
            className="flex items-center justify-between px-2 py-1.5 bg-gray-900/50 rounded"
          >
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span>{item.icon}</span>
              {item.label}
            </span>
            <span className={`text-sm font-mono font-bold ${item.color}`}>
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
