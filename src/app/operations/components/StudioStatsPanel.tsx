'use client';

import { PipelineStats } from '../lib/types';
import { Activity, Heart, FileText, Package, ClipboardList, CheckCircle, Bug, Brain, TrendingUp } from 'lucide-react';

interface StudioStatsPanelProps {
  stats: PipelineStats | null;
  loading?: boolean;
}

interface StatItem {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  category: 'input' | 'process' | 'output';
}

export default function StudioStatsPanel({ stats, loading }: StudioStatsPanelProps) {
  if (loading) {
    return (
      <div className="h-full bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-3 border-b border-gray-700">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Today's Pipeline
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-12 bg-gray-700/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const inputStats: StatItem[] = [
    {
      label: 'Context Flips',
      value: stats?.flips || 0,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      icon: <Activity className="w-5 h-5" />,
      category: 'input'
    },
    {
      label: 'Heartbeats',
      value: stats?.heartbeats || 0,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      icon: <Heart className="w-5 h-5" />,
      category: 'input'
    },
    {
      label: 'Transcripts',
      value: stats?.transcripts || 0,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      icon: <FileText className="w-5 h-5" />,
      category: 'input'
    },
  ];

  const processStats: StatItem[] = [
    {
      label: 'Sessions',
      value: stats?.sessions || 0,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      icon: <Package className="w-5 h-5" />,
      category: 'process'
    },
    {
      label: 'Worklogs',
      value: stats?.worklogs || 0,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      icon: <ClipboardList className="w-5 h-5" />,
      category: 'process'
    },
  ];

  const outputStats: StatItem[] = [
    {
      label: 'Todos',
      value: stats?.todos || 0,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      icon: <CheckCircle className="w-5 h-5" />,
      category: 'output'
    },
    {
      label: 'Bugs',
      value: stats?.bugs || 0,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      icon: <Bug className="w-5 h-5" />,
      category: 'output'
    },
    {
      label: 'Knowledge',
      value: stats?.knowledge || 0,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/30',
      icon: <Brain className="w-5 h-5" />,
      category: 'output'
    },
  ];

  const totalItems = (stats?.flips || 0) + (stats?.heartbeats || 0) + (stats?.transcripts || 0);
  const totalProcessed = (stats?.sessions || 0) + (stats?.worklogs || 0);
  const totalOutput = (stats?.todos || 0) + (stats?.bugs || 0) + (stats?.knowledge || 0);

  const renderStatCard = (item: StatItem) => (
    <div
      key={item.label}
      className={`${item.bgColor} ${item.borderColor} border rounded-lg p-3 transition-all hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={item.color}>{item.icon}</div>
          <span className="text-xs text-gray-400">{item.label}</span>
        </div>
        <span className={`text-xl font-bold font-mono ${item.color}`}>
          {item.value.toLocaleString()}
        </span>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Today's Pipeline
          </h3>
          <div className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Input Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Input</span>
            <span className="text-xs text-blue-400 font-mono">{totalItems} total</span>
          </div>
          <div className="space-y-2">
            {inputStats.map(renderStatCard)}
          </div>
        </div>

        {/* Processing Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Processing</span>
            <span className="text-xs text-cyan-400 font-mono">{totalProcessed} total</span>
          </div>
          <div className="space-y-2">
            {processStats.map(renderStatCard)}
          </div>
        </div>

        {/* Output Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Output</span>
            <span className="text-xs text-orange-400 font-mono">{totalOutput} total</span>
          </div>
          <div className="space-y-2">
            {outputStats.map(renderStatCard)}
          </div>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="flex-shrink-0 border-t border-gray-700 bg-gray-900/50 px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Pipeline Health</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
