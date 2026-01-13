'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, FolderOpen, Tag, FileText, Users } from 'lucide-react';

interface WorklogDetail {
  ts_id: string;
  block_id?: string;
  mode: string;
  source_type?: string; // internal/external
  title: string | null;
  briefing: string | null;
  clean_text: string | null;
  raw_text?: string | null;
  segment_start: string;
  segment_end: string;
  window_start: string | null;
  window_end: string | null;
  duration_hours: number;
  status: string;
  cleaned_at?: string | null;
  created_at: string;
  project_slug: string | null;
  project_name: string | null;
  session_count: number;
  message_count?: number;
  sessions: Array<{
    id: string;
    segment_start: string;
    segment_end: string;
    message_count: number;
    status: string;
  }>;
}

const MODE_COLORS: Record<string, string> = {
  worklog: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  project: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  forge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  support: 'bg-green-500/20 text-green-400 border-green-500/30',
  planning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const SOURCE_COLORS: Record<string, string> = {
  internal: 'bg-blue-600 text-white',
  external: 'bg-teal-600 text-white',
};

export default function WorklogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tsId = params.tsId as string;
  
  const [worklog, setWorklog] = useState<WorklogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorklog() {
      try {
        const res = await fetch(`/session-logs/api/${tsId}`);
        const data = await res.json();
        
        if (!data.success) {
          setError(data.error || 'Worklog not found');
          return;
        }
        
        setWorklog(data.worklog);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (tsId) fetchWorklog();
  }, [tsId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (hours: number) => {
    if (!hours) return 'Unknown';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading worklog...</div>
      </div>
    );
  }

  if (error || !worklog) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-6">
        <button
          onClick={() => router.push('/session-logs')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft size={20} />
          Back to Library
        </button>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400">{error || 'Worklog not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#12121a]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/session-logs')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            Back to Library
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{worklog.ts_id}</h1>
                {worklog.source_type && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    SOURCE_COLORS[worklog.source_type] || 'bg-gray-600 text-white'
                  }`}>
                    {worklog.source_type === 'internal' ? 'INT' : worklog.source_type === 'external' ? 'EXT' : worklog.source_type.toUpperCase()}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${MODE_COLORS[worklog.mode?.toLowerCase()] || MODE_COLORS.other}`}>
                  {worklog.mode || 'worklog'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  worklog.status === 'cleaned' ? 'bg-green-500/20 text-green-400' :
                  worklog.status === 'archived' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {worklog.status}
                </span>
              </div>

              {(worklog.project_name || worklog.project_slug) && (
                <div className="flex items-center gap-2 text-gray-400">
                  <FolderOpen size={16} />
                  <span>{worklog.project_name || worklog.project_slug}</span>
                  {worklog.project_name && worklog.project_slug && (
                    <span className="text-gray-600">({worklog.project_slug})</span>
                  )}
                </div>
              )}

              {worklog.message_count && (
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                  <span>{worklog.message_count} messages</span>
                  <span className="text-gray-600">|</span>
                  <span>{worklog.session_count} session{worklog.session_count !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            
            <div className="text-right text-sm text-gray-400">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Calendar size={14} />
                <span>{formatDate(worklog.segment_start)}</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Clock size={14} />
                <span>{formatTime(worklog.segment_start)} - {formatTime(worklog.segment_end)}</span>
                <span className="text-gray-600">({formatDuration(worklog.duration_hours)})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Briefing */}
        {worklog.briefing && (
          <div className="bg-[#1a1a24] border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText size={18} />
              Briefing
            </h2>
            <p className="text-gray-300 whitespace-pre-wrap">{worklog.briefing}</p>
          </div>
        )}

        {/* Sessions */}
        {worklog.sessions && worklog.sessions.length > 0 && (
          <div className="bg-[#1a1a24] border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Users size={18} />
              Sessions ({worklog.sessions.length})
            </h2>
            <div className="space-y-2">
              {worklog.sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between text-sm bg-[#12121a] rounded p-3">
                  <span className="text-gray-400 font-mono">{session.id.slice(0, 8)}...</span>
                  <span className="text-gray-500">
                    {session.segment_start ? formatTime(session.segment_start) : '??:??'}
                    {session.segment_end ? ` - ${formatTime(session.segment_end)}` : ''}
                  </span>
                  <span className="text-gray-500">{session.message_count || 0} msgs</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    session.status === 'cleaned' ? 'bg-green-500/20 text-green-400' :
                    session.status === 'archived' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {session.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transcript */}
        <div className="bg-[#1a1a24] border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Tag size={18} />
            Cleaned Transcript
          </h2>
          {worklog.clean_text ? (
            <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed max-h-[600px] overflow-y-auto">
              {worklog.clean_text}
            </pre>
          ) : (
            <p className="text-gray-500 italic">No transcript available</p>
          )}
        </div>
      </div>
    </div>
  );
}
