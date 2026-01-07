'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, BookOpen, Calendar, ChevronDown, ChevronRight, 
  Send, Square, CheckSquare, FileText, Bug, Lightbulb, MessageSquare,
  ExternalLink
} from 'lucide-react';

interface JournalEntry {
  id: string;
  project_id: string;
  bucket: string;
  status: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  metadata: {
    entry_date?: string;
    evidence_ids?: string[];
    child_project_ids?: string[];
    generated_by?: string;
  };
}

interface QueueItem {
  id: string;
  project_id: string;
  bucket: string;
  status: string;
  title: string;
  content: string;
  source_session_id: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  project_name?: string;
}

interface SourceItem {
  id: string;
  project_id: string;
  bucket: string;
  status: string;
  title: string;
  content: string;
  source_session_id: string | null;
  created_at: string;
  project_name: string | null;
  project_slug: string | null;
}

interface DailyJournalTabProps {
  projectId: string;
  projectName?: string;
  childProjectIds?: string[];
}

const BUCKET_ICONS: Record<string, typeof FileText> = {
  'Todos': FileText,
  'Bugs Open': Bug,
  'Work Log': MessageSquare,
  'Decisions': Lightbulb,
};

const BUCKET_COLORS: Record<string, string> = {
  'Todos': 'text-blue-400',
  'Bugs Open': 'text-red-400',
  'Work Log': 'text-purple-400',
  'Decisions': 'text-yellow-400',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export default function DailyJournalTab({ projectId, projectName, childProjectIds }: DailyJournalTabProps) {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [journalEntry, setJournalEntry] = useState<JournalEntry | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPromoting, setIsPromoting] = useState(false);
  const [bucketFilter, setBucketFilter] = useState<string>('All');
  const [showSources, setShowSources] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchJournal = useCallback(async () => {
    try {
      const res = await fetch(`/project-management/api/parent/journal?parent_project_id=${projectId}&entry_date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setJournalEntry(data.entry);
      }
    } catch (e) {
      console.error('Failed to fetch journal:', e);
    }
  }, [projectId, selectedDate]);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`/project-management/api/parent/queue?parent_project_id=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setQueueItems(data.items || []);
      }
    } catch (e) {
      console.error('Failed to fetch queue:', e);
    }
  }, [projectId]);

  const fetchSources = useCallback(async (evidenceIds: string[]) => {
    if (evidenceIds.length === 0) {
      setSources([]);
      return;
    }
    setIsLoadingSources(true);
    try {
      const res = await fetch('/project-management/api/staging/by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: evidenceIds }),
      });
      const data = await res.json();
      if (data.success) {
        setSources(data.items || []);
      }
    } catch (e) {
      console.error('Failed to fetch sources:', e);
    } finally {
      setIsLoadingSources(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchJournal(), fetchQueue()]);
      setIsLoading(false);
    };
    load();
  }, [fetchJournal, fetchQueue]);

  useEffect(() => {
    if (journalEntry?.metadata?.evidence_ids && showSources) {
      fetchSources(journalEntry.metadata.evidence_ids);
    }
  }, [journalEntry, showSources, fetchSources]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filtered = filteredQueue;
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)));
    }
  };

  const handlePromote = async () => {
    if (selectedIds.size === 0) return;
    setIsPromoting(true);
    try {
      const res = await fetch('/project-management/api/parent/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_project_id: projectId,
          staging_ids: Array.from(selectedIds),
          target: 'journal',
          entry_date: selectedDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(`Promoted ${selectedIds.size} items to Journal (${selectedDate})`);
        setSelectedIds(new Set());
        await Promise.all([fetchJournal(), fetchQueue()]);
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(`Error: ${data.error}`);
        setTimeout(() => setToast(null), 5000);
      }
    } catch (e) {
      console.error('Failed to promote:', e);
      setToast('Failed to promote items');
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsPromoting(false);
    }
  };

  const filteredQueue = bucketFilter === 'All' 
    ? queueItems 
    : queueItems.filter(i => i.bucket === bucketFilter);

  const buckets = ['All', ...new Set(queueItems.map(i => i.bucket))];
  const evidenceCount = journalEntry?.metadata?.evidence_ids?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Header with Date Picker */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Daily Journal</h3>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Journal Entry Section */}
        <div className="p-4 border-b border-gray-700">
          <h4 className="text-lg text-white font-medium mb-3">
            {formatDate(selectedDate)}
          </h4>

          {journalEntry ? (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-300 text-sm">
                  {journalEntry.content || journalEntry.title || 'No content'}
                </div>
              </div>

              {/* Sources toggle */}
              {evidenceCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                  >
                    {showSources ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    Sources ({evidenceCount})
                  </button>

                  {showSources && (
                    <div className="mt-3 space-y-2">
                      {isLoadingSources ? (
                        <div className="text-gray-500 text-sm">Loading sources...</div>
                      ) : (
                        sources.map(source => {
                          const Icon = BUCKET_ICONS[source.bucket] || FileText;
                          const color = BUCKET_COLORS[source.bucket] || 'text-gray-400';
                          return (
                            <div key={source.id} className="flex items-start gap-2 p-2 bg-gray-750 rounded text-sm">
                              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${color}`}>{source.bucket}</span>
                                  {source.project_name && (
                                    <span className="text-xs text-gray-500">• {source.project_name}</span>
                                  )}
                                </div>
                                <p className="text-gray-300 truncate">{source.title}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(source.created_at).toLocaleDateString()}
                                  {source.source_session_id && ` • Session: ${source.source_session_id.slice(0, 8)}...`}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 border-dashed rounded-lg p-8 text-center">
              <BookOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">No journal entry for this date</p>
              <p className="text-gray-600 text-sm mt-1">Promote items from the queue below to create one</p>
            </div>
          )}
        </div>

        {/* Publish Queue Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium flex items-center gap-2">
              <Send className="w-4 h-4 text-green-400" />
              Publish Queue
              <span className="text-xs text-gray-500">({queueItems.length} ready)</span>
            </h4>

            {/* Bucket Filter */}
            <div className="flex items-center gap-2">
              {buckets.map(bucket => (
                <button
                  key={bucket}
                  onClick={() => setBucketFilter(bucket)}
                  className={`px-2 py-1 text-xs rounded ${
                    bucketFilter === bucket
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {bucket}
                </button>
              ))}
            </div>
          </div>

          {/* Batch Action Bar */}
          {selectedIds.size > 0 && (
            <div className="mb-3 px-3 py-2 bg-blue-900/30 border border-blue-700/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-blue-300 text-sm">{selectedIds.size} selected</span>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <button
                onClick={handlePromote}
                disabled={isPromoting}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-500 rounded text-white disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                {isPromoting ? 'Promoting...' : `Promote to ${selectedDate}`}
              </button>
            </div>
          )}

          {/* Queue Items */}
          {filteredQueue.length > 0 ? (
            <div className="space-y-2">
              {/* Select All */}
              <div className="flex items-center gap-2 px-2 py-1">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white">
                  {selectedIds.size === filteredQueue.length ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  Select All
                </button>
              </div>

              {filteredQueue.map(item => {
                const Icon = BUCKET_ICONS[item.bucket] || FileText;
                const color = BUCKET_COLORS[item.bucket] || 'text-gray-400';
                const isSelected = selectedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 bg-gray-800 border rounded-lg ${
                      isSelected ? 'border-blue-500' : 'border-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => toggleSelection(item.id)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                      )}
                    </button>

                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${color}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${color} bg-gray-700`}>
                          {item.bucket}
                        </span>
                        {item.project_name && (
                          <span className="text-xs text-gray-500">{item.project_name}</span>
                        )}
                      </div>
                      <p className="text-gray-200 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 border-dashed rounded-lg p-8 text-center">
              <Send className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">No items ready for publishing</p>
              <p className="text-gray-600 text-sm mt-1">
                Mark items as &quot;Ready&quot; in child projects to see them here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
