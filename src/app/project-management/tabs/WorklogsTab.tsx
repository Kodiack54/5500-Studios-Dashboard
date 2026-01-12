'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Clock, MessageSquare, FileText, ChevronDown, ChevronRight } from 'lucide-react';

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

interface WorklogsTabProps {
  projectPath: string;
  projectId: string;
  projectName: string;
  isParent?: boolean;
  childProjectIds?: string[];
}

export default function WorklogsTab({ projectPath, projectId, projectName, isParent, childProjectIds }: WorklogsTabProps) {
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWorklogs();
  }, [projectId]);

  async function fetchWorklogs() {
    setLoading(true);
    try {
      const response = await fetch(`/project-management/api/worklogs?project_id=${projectId}&limit=50`);
      const data = await response.json();
      if (data.success) {
        setWorklogs(data.worklogs);
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

  if (worklogs.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Worklogs Yet</h3>
        <p className="text-gray-400">Worklogs will appear here as transcripts are processed into 3-hour blocks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Worklogs
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {worklogs.length} worklog block{worklogs.length !== 1 ? 's' : ''} from transcript processing
          </p>
        </div>
      </div>

      {/* Worklog List */}
      <div className="space-y-3">
        {worklogs.map((worklog) => (
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
