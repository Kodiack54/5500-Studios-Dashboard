'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Clock, MessageSquare, FileText, ChevronDown, ChevronRight, BarChart3, FolderTree } from 'lucide-react';

interface Worklog {
  id: string;
  project_id: string;
  project_slug: string;
  lane: string;
  pc_tag: string;
  window_start: string;
  window_end: string;
  message_count: number;
  bytes_raw: number;
  bytes_clean: number;
  raw_text?: string;
  clean_text_worklog?: string;
  created_at: string;
  cleaned_at?: string;
}

interface RollupStats {
  totalBlocks: number;
  totalMessages: number;
  totalBytes: number;
  lastActivity: string | null;
  byLane: Record<string, { count: number; messages: number; bytes: number }>;
  byProject: Record<string, { slug: string; count: number; messages: number; lastActivity: string | null }>;
}

interface WorklogsTabProps {
  projectPath: string;
  projectId: string;
  projectName: string;
  isParent?: boolean;
  childProjectIds?: string[];
}

export default function WorklogsTab({ projectPath, projectId, projectName, isParent, childProjectIds }: WorklogsTabProps) {
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [rollup, setRollup] = useState<RollupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedLane, setSelectedLane] = useState<string | null>(null);

  useEffect(() => {
    fetchWorklogs();
  }, [projectId, isParent, childProjectIds]);

  async function fetchWorklogs() {
    setLoading(true);
    try {
      // For parent projects, fetch worklogs from all children
      let url: string;
      if (isParent && childProjectIds && childProjectIds.length > 0) {
        url = `/project-management/api/worklogs?project_ids=${childProjectIds.join(',')}&limit=100&include_rollup=true`;
      } else {
        url = `/project-management/api/worklogs?project_id=${projectId}&limit=50&include_rollup=true`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setWorklogs(data.worklogs);
        setRollup(data.rollup);
      }
    } catch (error) {
      console.error('Error fetching worklogs:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getLaneColor = (lane: string) => {
    switch (lane) {
      case 'worklog': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'planning': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'forge': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'support': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin text-2xl">⏳</div>
        <span className="ml-2 text-gray-400">Loading worklogs...</span>
      </div>
    );
  }

  // Filter worklogs by selected lane
  const filteredWorklogs = selectedLane
    ? worklogs.filter(w => w.lane === selectedLane)
    : worklogs;

  if (worklogs.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Worklogs Yet</h3>
        <p className="text-gray-400">
          {isParent
            ? 'Worklogs from child projects will appear here as transcripts are processed.'
            : 'Worklogs will appear here as transcripts are processed into 3-hour blocks.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Rollup Stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            {isParent ? 'Worklogs (Aggregated from Children)' : 'Worklogs'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {worklogs.length} worklog block{worklogs.length !== 1 ? 's' : ''} from transcript processing
            {rollup?.lastActivity && (
              <span> · Last activity: {formatDate(rollup.lastActivity)}</span>
            )}
          </p>
        </div>
      </div>

      {/* Rollup Stats Panel */}
      {rollup && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">
              {isParent ? 'Child Projects Summary' : 'Activity Summary'}
            </h3>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-white">{rollup.totalBlocks}</p>
              <p className="text-xs text-gray-400">Total Blocks</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-white">{rollup.totalMessages.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Messages</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-white">{formatBytes(rollup.totalBytes)}</p>
              <p className="text-xs text-gray-400">Content Size</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-white">{Object.keys(rollup.byProject).length}</p>
              <p className="text-xs text-gray-400">{isParent ? 'Active Children' : 'Projects'}</p>
            </div>
          </div>

          {/* Lane Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedLane(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedLane
                  ? 'bg-white text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All ({rollup.totalBlocks})
            </button>
            {Object.entries(rollup.byLane).map(([lane, stats]) => (
              <button
                key={lane}
                onClick={() => setSelectedLane(selectedLane === lane ? null : lane)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  selectedLane === lane
                    ? getLaneColor(lane)
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-transparent'
                }`}
              >
                {lane} ({stats.count})
              </button>
            ))}
          </div>

          {/* Child Projects Breakdown - Only for parent */}
          {isParent && Object.keys(rollup.byProject).length > 0 && (
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <FolderTree className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-semibold text-gray-400 uppercase">By Child Project</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(rollup.byProject).map(([id, stats]) => (
                  <div key={id} className="bg-gray-900/50 rounded p-2 flex items-center justify-between">
                    <span className="text-sm text-white truncate">{stats.slug}</span>
                    <span className="text-xs text-gray-400">{stats.count} blocks</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Worklog List */}
      <div className="space-y-3">
        {filteredWorklogs.map((worklog) => (
          <div
            key={worklog.id}
            className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
          >
            {/* Header Row */}
            <button
              onClick={() => setExpandedId(expandedId === worklog.id ? null : worklog.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {expandedId === worklog.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}

                {/* Time Window */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-white font-medium">{formatDate(worklog.window_start)}</span>
                </div>

                {/* Lane Badge */}
                <span className={`px-2 py-0.5 rounded text-xs border ${getLaneColor(worklog.lane)}`}>
                  {worklog.lane}
                </span>

                {/* Project Slug - show for parent rollups */}
                {isParent && (
                  <span className="text-blue-400 text-sm">{worklog.project_slug}</span>
                )}

                {/* PC Tag */}
                <span className="text-gray-500 text-sm">{worklog.pc_tag}</span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1 text-gray-400">
                  <MessageSquare className="w-4 h-4" />
                  <span>{worklog.message_count}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <FileText className="w-4 h-4" />
                  <span>{formatBytes(worklog.bytes_clean || 0)}</span>
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {expandedId === worklog.id && worklog.clean_text_worklog && (
              <div className="px-4 py-3 border-t border-gray-700 bg-gray-900/50">
                <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                  {worklog.clean_text_worklog.substring(0, 5000)}
                  {worklog.clean_text_worklog.length > 5000 && (
                    <span className="text-gray-500">... (truncated)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
