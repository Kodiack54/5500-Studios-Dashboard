'use client';

import { useState, useEffect } from 'react';

interface ActionEntry {
  action_code: string;
  verb: string | null;
  label: string | null;
  description: string | null;
  first_seen_at: string;
  last_seen_at: string;
  seen_count: number;
  is_tracked: boolean;
  show_in_feed: boolean;
  last_seen_agent: string | null;
  last_seen_node_id: string | null;
  last_seen_who_id: string | null;
  last_seen_who_label: string | null;
  sample_payload: Record<string, unknown> | null;
  message_template: string | null;
}

interface VerbEntry {
  verb: string;
  color: string;
  severity: number;
  description: string | null;
  sort_order: number;
}

interface WhoEntry {
  who_id: string;
  who_label: string;
  port: number | null;
  who_type: string;
  is_primary: boolean;
  is_monitored: boolean;
  family_key: string | null;
}

interface HeartbeatRegistryModalProps {
  onClose: () => void;
}

// Color options for verb badges
const COLOR_OPTIONS = [
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'green', class: 'bg-green-500' },
  { name: 'red', class: 'bg-red-500' },
  { name: 'yellow', class: 'bg-yellow-500' },
  { name: 'purple', class: 'bg-purple-500' },
  { name: 'orange', class: 'bg-orange-500' },
  { name: 'gray', class: 'bg-gray-500' },
];

export default function HeartbeatRegistryModal({ onClose }: HeartbeatRegistryModalProps) {
  const [activeTab, setActiveTab] = useState<'actions' | 'verbs'>('actions');
  const [actions, setActions] = useState<ActionEntry[]>([]);
  const [verbs, setVerbs] = useState<VerbEntry[]>([]);
  const [programs, setPrograms] = useState<WhoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // Program filter for actions tab
  const [programFilter, setProgramFilter] = useState<string>('all');

  // Expanded action for inline editing
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [actionsRes, verbsRes, whoRes] = await Promise.all([
          fetch('/api/operations/actions'),
          fetch('/api/operations/verbs'),
          fetch('/api/operations/who?primary=1'),
        ]);

        const actionsData = await actionsRes.json();
        const verbsData = await verbsRes.json();
        const whoData = await whoRes.json();

        if (actionsData.success) {
          setActions(actionsData.actions || []);
        }
        if (verbsData) {
          const verbList = Object.entries(verbsData.verbsByCode || {}).map(
            ([code, info]: [string, any]) => ({
              verb: code,
              color: info.color || 'gray',
              severity: info.severity || 0,
              description: info.description || null,
              sort_order: info.sort_order || 0,
            })
          );
          setVerbs(verbList);
        }
        if (whoData.success) {
          setPrograms(whoData.programs || []);
        }
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update action
  const updateAction = async (
    actionCode: string,
    updates: Partial<Pick<ActionEntry, 'verb' | 'is_tracked' | 'show_in_feed' | 'description' | 'message_template'>>
  ) => {
    setSaving(actionCode);
    try {
      const res = await fetch(`/api/operations/actions/${encodeURIComponent(actionCode)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setActions((prev) =>
          prev.map((a) =>
            a.action_code === actionCode ? { ...a, ...data.action } : a
          )
        );
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  // Count untracked actions
  const untrackedCount = actions.filter((a) => !a.is_tracked).length;

  // Filter actions by program
  const filterByProgram = (actionList: ActionEntry[]) => {
    if (programFilter === 'all') return actionList;
    return actionList.filter((a) => a.last_seen_who_id === programFilter);
  };

  // Split actions into untracked and tracked (after filtering)
  const filteredActions = filterByProgram(actions);
  const untrackedActions = filteredActions.filter((a) => !a.is_tracked);
  const trackedActions = filteredActions.filter((a) => a.is_tracked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-[1000px] max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Heartbeat Registry</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs + Program Filter */}
        <div className="flex items-center justify-between px-6 pt-4 border-b border-gray-700/50">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'actions'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Actions
              {untrackedCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                  {untrackedCount} new
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('verbs')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'verbs'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Verbs
            </button>
          </div>

          {/* Program Filter - only show on Actions tab */}
          {activeTab === 'actions' && (
            <div className="flex items-center gap-2 pb-2">
              <span className="text-xs text-gray-500">Program:</span>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Programs</option>
                {programs.map((p) => (
                  <option key={p.who_id} value={p.who_id}>
                    {p.who_label} {p.port ? `(:${p.port})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">Error: {error}</div>
          ) : activeTab === 'actions' ? (
            <div className="space-y-6">
              {/* Untracked Section */}
              {untrackedActions.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase text-yellow-400 font-medium mb-2">
                    New / Untracked ({untrackedActions.length})
                  </h3>
                  <div className="space-y-1">
                    {untrackedActions.map((action) => (
                      <ActionRow
                        key={action.action_code}
                        action={action}
                        verbs={verbs}
                        saving={saving === action.action_code}
                        expanded={expandedAction === action.action_code}
                        onToggleExpand={() => setExpandedAction(
                          expandedAction === action.action_code ? null : action.action_code
                        )}
                        onUpdate={(updates) => updateAction(action.action_code, updates)}
                        formatRelativeTime={formatRelativeTime}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tracked Section */}
              {trackedActions.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase text-gray-500 font-medium mb-2">
                    Tracked ({trackedActions.length})
                  </h3>
                  <div className="space-y-1">
                    {trackedActions.map((action) => (
                      <ActionRow
                        key={action.action_code}
                        action={action}
                        verbs={verbs}
                        saving={saving === action.action_code}
                        expanded={expandedAction === action.action_code}
                        onToggleExpand={() => setExpandedAction(
                          expandedAction === action.action_code ? null : action.action_code
                        )}
                        onUpdate={(updates) => updateAction(action.action_code, updates)}
                        formatRelativeTime={formatRelativeTime}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredActions.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  {programFilter !== 'all'
                    ? 'No actions from this program'
                    : 'No action codes registered yet'}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {verbs.map((verb) => (
                <VerbRow key={verb.verb} verb={verb} />
              ))}
              {verbs.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No verbs defined
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <span>
            {filteredActions.length} actions{programFilter !== 'all' ? ' (filtered)' : ''}, {verbs.length} verbs, {programs.length} programs
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Action Row Component - with expandable inline editor
function ActionRow({
  action,
  verbs,
  saving,
  expanded,
  onToggleExpand,
  onUpdate,
  formatRelativeTime,
}: {
  action: ActionEntry;
  verbs: VerbEntry[];
  saving: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Pick<ActionEntry, 'verb' | 'is_tracked' | 'show_in_feed' | 'description' | 'message_template'>>) => void;
  formatRelativeTime: (ts: string) => string;
}) {
  const [localDescription, setLocalDescription] = useState(action.description || '');
  const [localTemplate, setLocalTemplate] = useState(action.message_template || '');

  // Reset local state when action changes
  useEffect(() => {
    setLocalDescription(action.description || '');
    setLocalTemplate(action.message_template || '');
  }, [action.description, action.message_template]);

  const selectedVerb = verbs.find((v) => v.verb === action.verb);
  const verbColor = selectedVerb ? COLOR_OPTIONS.find((c) => c.name === selectedVerb.color)?.class : null;

  return (
    <div className={`rounded bg-gray-800/50 ${saving ? 'opacity-50' : ''}`}>
      {/* Main Row */}
      <div
        className="flex items-center gap-3 py-2 px-3 hover:bg-gray-800 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Expand indicator */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Track Toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={action.is_tracked}
            onChange={(e) => onUpdate({ is_tracked: e.target.checked })}
            disabled={saving}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">Track</span>
        </label>

        {/* Show Toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={action.show_in_feed}
            onChange={(e) => onUpdate({ show_in_feed: e.target.checked })}
            disabled={saving || !action.is_tracked}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500 disabled:opacity-40"
          />
          <span className={`text-xs ${action.is_tracked ? 'text-gray-400' : 'text-gray-600'}`}>
            Show
          </span>
        </label>

        {/* Verb badge (if mapped) */}
        {action.verb && verbColor && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${verbColor} text-white`}>
            {action.verb}
          </span>
        )}

        {/* Action Code */}
        <span className="font-mono text-sm text-cyan-400">
          {action.action_code}
        </span>

        {/* WHO Label - BLUE */}
        {action.last_seen_who_label && (
          <span className="text-xs font-medium text-blue-400">
            {action.last_seen_who_label}
          </span>
        )}

        {/* Stats */}
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span>last: {formatRelativeTime(action.last_seen_at)}</span>
          <span>seen: {action.seen_count.toLocaleString()}</span>
        </div>
      </div>

      {/* Expanded Editor Panel */}
      {expanded && (
        <div className="px-4 py-3 border-t border-gray-700/50 bg-gray-800/30 space-y-3">
          {/* Verb Mapping Row */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-24">Verb Mapping:</span>
            <select
              value={action.verb || ''}
              onChange={(e) => onUpdate({ verb: e.target.value || null })}
              disabled={saving}
              className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">unmapped</option>
              {verbs.map((v) => (
                <option key={v.verb} value={v.verb}>
                  {v.verb} - {v.description || 'No description'}
                </option>
              ))}
            </select>
            {selectedVerb && (
              <span className="text-xs text-gray-400">
                Color: {selectedVerb.color}
              </span>
            )}
          </div>

          {/* Description Row */}
          <div className="flex items-start gap-3">
            <span className="text-xs text-gray-500 w-24 pt-1">Description:</span>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                placeholder="What does this action mean?"
                disabled={saving}
                className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
              {localDescription !== (action.description || '') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ description: localDescription || null });
                  }}
                  disabled={saving}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          {/* Message Template Row */}
          <div className="flex items-start gap-3">
            <span className="text-xs text-gray-500 w-24 pt-1">Template:</span>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={localTemplate}
                onChange={(e) => setLocalTemplate(e.target.value)}
                placeholder="e.g., Looking for {target}"
                disabled={saving}
                className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                onClick={(e) => e.stopPropagation()}
              />
              {localTemplate !== (action.message_template || '') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ message_template: localTemplate || null });
                  }}
                  disabled={saving}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          {/* Preview Row */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-700/50">
            <span className="text-xs text-gray-500 w-24">Preview:</span>
            <div className="flex items-center gap-2 text-xs">
              {action.verb && verbColor && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${verbColor} text-white`}>
                  {action.verb}
                </span>
              )}
              <span className="text-blue-400 font-medium">
                {action.last_seen_who_label || '[Unknown]'}
              </span>
              <span className="text-gray-300">
                {localTemplate || localDescription || action.action_code}
              </span>
            </div>
          </div>

          {/* Sample Payload (collapsed) */}
          {action.sample_payload && (
            <details className="text-xs">
              <summary className="text-gray-500 cursor-pointer hover:text-gray-400">
                Sample Payload
              </summary>
              <pre className="mt-2 p-2 bg-gray-900 rounded text-gray-400 overflow-x-auto">
                {JSON.stringify(action.sample_payload, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// Verb Row Component
function VerbRow({ verb }: { verb: VerbEntry }) {
  const colorClass = COLOR_OPTIONS.find((c) => c.name === verb.color)?.class || 'bg-gray-500';

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded bg-gray-800/50 hover:bg-gray-800">
      {/* Color chip */}
      <div className={`w-4 h-4 rounded ${colorClass}`} />

      {/* Verb code */}
      <span className="font-mono text-sm text-white min-w-[60px]">{verb.verb}</span>

      {/* Description */}
      <span className="text-sm text-gray-400 flex-1">
        {verb.description || 'No description'}
      </span>

      {/* Severity */}
      <span className="text-xs text-gray-500">severity: {verb.severity}</span>
    </div>
  );
}
