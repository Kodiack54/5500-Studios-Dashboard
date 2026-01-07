'use client';

import { useState, useEffect } from 'react';
import { StudioService, STATUS_COLORS } from '../config';
import { ServiceHealth, LogsResponse } from '../lib/types';

interface ServiceDetailPanelProps {
  service: StudioService;
  health?: ServiceHealth;
  onRefresh: () => void;
}

export default function ServiceDetailPanel({
  service,
  health,
  onRefresh,
}: ServiceDetailPanelProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  const status = health?.status || 'unknown';

  // Fetch logs when requested
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/operations/logs/${service.id}?lines=50`);
      const data: LogsResponse = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (showLogs && logs.length === 0) {
      fetchLogs();
    }
  }, [showLogs]);

  const formatUptime = (ms?: number) => {
    if (!ms) return '-';
    const seconds = Math.floor((Date.now() - ms) / 1000);
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatMemory = (bytes?: number) => {
    if (!bytes) return '-';
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-lg font-semibold text-white leading-tight">
            {service.label}
          </h3>
          <p className="text-xs text-gray-500">
            {service.port ? `Port ${service.port}` : 'No port'} | {service.pm2Name || service.id}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-xs bg-gray-700 text-gray-400 rounded hover:bg-gray-600 hover:text-white transition-colors flex-shrink-0"
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Status"
          value={status}
          color={status === 'online' ? 'green' : status === 'degraded' ? 'yellow' : status === 'offline' ? 'red' : 'gray'}
        />
        <StatCard
          label="Uptime"
          value={formatUptime(health?.uptime)}
          color="cyan"
        />
        <StatCard
          label="Memory"
          value={formatMemory(health?.memory)}
          color="blue"
        />
        <StatCard
          label="CPU"
          value={health?.cpu !== undefined ? `${health.cpu.toFixed(1)}%` : '-'}
          color={health?.cpu && health.cpu > 80 ? 'red' : health?.cpu && health.cpu > 50 ? 'yellow' : 'green'}
        />
      </div>

      {/* Service Info */}
      <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Type</span>
          <span className="text-white capitalize">{service.type.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Group</span>
          <span className="text-white capitalize">{service.group.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Description</span>
          <span className="text-white">{service.description}</span>
        </div>
        {service.healthEndpoint && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Health Endpoint</span>
            <span className="text-white font-mono text-xs">{service.healthEndpoint}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Health Ping</span>
          <span className={health?.healthPing ? 'text-green-400' : 'text-gray-400'}>
            {health?.healthPing ? 'OK' : 'N/A'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex-1 px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
        >
          {showLogs ? 'Hide Logs' : 'Show Logs'}
        </button>
        {/* TODO: Implement start/restart/stop via SSH or PM2 endpoint */}
        <button
          className="px-3 py-2 text-sm bg-green-700/50 text-green-300 rounded hover:bg-green-600/50 transition-colors disabled:opacity-50"
          disabled
          title="Not yet implemented"
        >
          Restart
        </button>
      </div>

      {/* Logs Panel */}
      {showLogs && (
        <div className="flex-1 bg-gray-900 rounded-lg p-2 overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500 uppercase">Logs</span>
            <button
              onClick={fetchLogs}
              className="text-xs text-gray-400 hover:text-white"
              disabled={logsLoading}
            >
              {logsLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <div className="font-mono text-xs text-gray-300 space-y-0.5">
            {logs.length > 0 ? (
              logs.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap break-all">
                  {line}
                </div>
              ))
            ) : (
              <div className="text-gray-500">No logs available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-500/30 bg-blue-500/10',
    green: 'border-green-500/30 bg-green-500/10',
    red: 'border-red-500/30 bg-red-500/10',
    yellow: 'border-yellow-500/30 bg-yellow-500/10',
    cyan: 'border-cyan-500/30 bg-cyan-500/10',
    gray: 'border-gray-500/30 bg-gray-500/10',
  };

  const textColors: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    cyan: 'text-cyan-400',
    gray: 'text-gray-400',
  };

  return (
    <div className={`border rounded-lg p-3 ${colorClasses[color]}`}>
      <div className={`text-xl font-bold capitalize ${textColors[color]}`}>{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}
