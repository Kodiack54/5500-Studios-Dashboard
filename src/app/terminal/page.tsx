'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Activity, Cpu, MessageSquare, Clock, Zap, RefreshCw, Terminal as TerminalIcon, Circle } from 'lucide-react';

interface HeartbeatData {
  timestamp: string;
  status: 'alive' | 'processing' | 'idle';
  uptime: number;
  lastActivity?: string;
  sessionsToday?: number;
  itemsExtracted?: number;
}

interface ActivityItem {
  id: string;
  timestamp: string;
  type: 'heartbeat' | 'session' | 'extraction' | 'error' | 'system';
  message: string;
  details?: string;
}

export default function TerminalPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [heartbeat, setHeartbeat] = useState<HeartbeatData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [pulseCount, setPulseCount] = useState(0);
  const [lastPulse, setLastPulse] = useState<Date | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  // Format uptime into human readable
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Add activity to feed
  const addActivity = useCallback((type: ActivityItem['type'], message: string, details?: string) => {
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 100)); // Keep last 100
  }, []);

  // Heartbeat pulse
  const pulse = useCallback(async () => {
    try {
      // Simulate heartbeat - connect to Susan or internal API
      const now = new Date();
      const uptimeSeconds = Math.floor((now.getTime() - (lastPulse?.getTime() || now.getTime())) / 1000) + pulseCount * 30;

      setHeartbeat({
        timestamp: now.toISOString(),
        status: 'alive',
        uptime: uptimeSeconds,
        lastActivity: 'Monitoring active',
        sessionsToday: Math.floor(Math.random() * 10) + 5,
        itemsExtracted: Math.floor(Math.random() * 50) + 20
      });

      setPulseCount(prev => prev + 1);
      setLastPulse(now);
      setIsConnected(true);

      // Add heartbeat activity every 10 pulses
      if (pulseCount % 10 === 0 && pulseCount > 0) {
        addActivity('heartbeat', `Heartbeat #${pulseCount}`, `Uptime: ${formatUptime(uptimeSeconds)}`);
      }
    } catch (err) {
      setIsConnected(false);
      addActivity('error', 'Heartbeat failed', (err as Error).message);
    }
  }, [pulseCount, lastPulse, addActivity]);

  // Start heartbeat on mount
  useEffect(() => {
    // Initial pulse
    pulse();
    addActivity('system', 'Terminal initialized', 'Claude internal monitor started');

    // Set up 30 second heartbeat
    heartbeatRef.current = setInterval(pulse, 30000);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, []);

  // Auto-scroll activity feed
  useEffect(() => {
    if (activityRef.current) {
      activityRef.current.scrollTop = 0;
    }
  }, [activities]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'heartbeat': return <Heart className="w-4 h-4 text-red-400" />;
      case 'session': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'extraction': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'error': return <Circle className="w-4 h-4 text-red-500" />;
      case 'system': return <Cpu className="w-4 h-4 text-emerald-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isConnected ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            <TerminalIcon className={`w-8 h-8 ${isConnected ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Claude Internal Terminal</h1>
            <p className="text-gray-400 text-sm">Live monitoring and heartbeat system</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isConnected ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={pulse}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Force pulse"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Heartbeat */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <Heart className={`w-6 h-6 ${isConnected ? 'text-red-400 animate-pulse' : 'text-gray-600'}`} />
            <span className="text-xs text-gray-500">HEARTBEAT</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{pulseCount}</div>
          <div className="text-sm text-gray-400">pulses</div>
        </div>

        {/* Uptime */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-6 h-6 text-blue-400" />
            <span className="text-xs text-gray-500">UPTIME</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {heartbeat ? formatUptime(heartbeat.uptime) : '--'}
          </div>
          <div className="text-sm text-gray-400">session time</div>
        </div>

        {/* Sessions Today */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <MessageSquare className="w-6 h-6 text-purple-400" />
            <span className="text-xs text-gray-500">SESSIONS</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {heartbeat?.sessionsToday || 0}
          </div>
          <div className="text-sm text-gray-400">today</div>
        </div>

        {/* Items Extracted */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span className="text-xs text-gray-500">EXTRACTED</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {heartbeat?.itemsExtracted || 0}
          </div>
          <div className="text-sm text-gray-400">items</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="font-semibold text-white">Activity Feed</h2>
            </div>
            <span className="text-xs text-gray-500">{activities.length} events</span>
          </div>

          <div
            ref={activityRef}
            className="h-[500px] overflow-y-auto p-4 space-y-2"
          >
            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Waiting for activity...</p>
              </div>
            ) : (
              activities.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white">{activity.message}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="text-xs text-gray-400 mt-1">{activity.details}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Panel */}
        <div className="space-y-4">
          {/* Current Status */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              System Status
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Status</span>
                <span className={`text-sm font-medium ${
                  heartbeat?.status === 'alive' ? 'text-emerald-400' :
                  heartbeat?.status === 'processing' ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {heartbeat?.status || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Last Pulse</span>
                <span className="text-sm text-white">
                  {lastPulse ? formatTime(lastPulse.toISOString()) : '--'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Next Pulse</span>
                <span className="text-sm text-white">~30s</span>
              </div>

              <div className="pt-3 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Health</span>
                  <span className="text-sm text-emerald-400">100%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => addActivity('system', 'Manual check triggered', 'User initiated system check')}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                Run System Check
              </button>
              <button
                onClick={() => addActivity('extraction', 'Extraction triggered', 'Manual extraction request')}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Trigger Extraction
              </button>
              <button
                onClick={() => setActivities([])}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
              >
                Clear Feed
              </button>
            </div>
          </div>

          {/* Connection Info */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h3 className="font-semibold text-white mb-3">Connection</h3>
            <div className="text-xs font-mono text-gray-400 space-y-1">
              <p>Terminal: localhost:5400</p>
              <p>Susan: localhost:5410</p>
              <p>Jen: localhost:5402</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
