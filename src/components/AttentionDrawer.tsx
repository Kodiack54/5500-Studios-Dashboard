'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AttentionItem {
  type: 'git' | 'db' | 'droplet';
  entity_id: string;
  title: string;
  attention_level: 'warn' | 'urgent';
  age_seconds: number;
  summary: string;
  deep_link: string;
  diagnostics: Record<string, any>;
}

interface AttentionData {
  success: boolean;
  attention: {
    overall: 'none' | 'warn' | 'urgent';
    counts: {
      total: number;
      urgent: number;
      warn: number;
    };
  };
  items: AttentionItem[];
  timestamp: string;
}

interface AttentionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AttentionData | null;
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function TypeBadge({ type }: { type: 'git' | 'db' | 'droplet' }) {
  const config = {
    git: { label: 'GIT', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    db: { label: 'DB', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    droplet: { label: 'DROPLET', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  };
  const c = config[type];
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}

export default function AttentionDrawer({ isOpen, onClose, initialData }: AttentionDrawerProps) {
  const [data, setData] = useState<AttentionData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch data on open (or use initialData)
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/operations/api/attention');
        if (!res.ok) throw new Error('Failed to fetch attention data');
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Unknown error');
        setData(json);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    // If no initial data, fetch immediately
    if (!initialData) {
      fetchData();
    } else {
      setData(initialData);
    }

    // Poll every 30s while open
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [isOpen, initialData]);

  const copyDiagnostics = async (item: AttentionItem) => {
    const payload = {
      type: item.type,
      entity_id: item.entity_id,
      attention_level: item.attention_level,
      age_seconds: item.age_seconds,
      summary: item.summary,
      diagnostics: item.diagnostics,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setToast('Copied to clipboard');
      setTimeout(() => setToast(null), 2000);
    } catch {
      setToast('Failed to copy');
      setTimeout(() => setToast(null), 2000);
    }
  };

  if (!isOpen) return null;

  const urgentItems = data?.items.filter(i => i.attention_level === 'urgent') || [];
  const warnItems = data?.items.filter(i => i.attention_level === 'warn') || [];

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Backdrop */}
      <div
        className="fixed top-14 bottom-0 left-64 right-0 z-30 bg-black/20"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed top-14 bottom-0 left-64 w-[420px] bg-gray-900 border-l border-gray-700 z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-yellow-400">!</span>
              Needs Attention
            </h3>
            {data?.timestamp && (
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {formatTimestamp(data.timestamp)}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Summary counts */}
        {data && (
          <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm text-gray-300">{data.attention.counts.urgent} urgent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-sm text-gray-300">{data.attention.counts.warn} warn</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Loading...
            </div>
          )}

          {error && (
            <div className="m-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && data && data.items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <span className="text-2xl mb-2">All clear</span>
              <span className="text-sm">No items need attention</span>
            </div>
          )}

          {!loading && !error && data && data.items.length > 0 && (
            <>
              {/* Urgent section */}
              {urgentItems.length > 0 && (
                <div className="border-b border-gray-700">
                  <div className="px-4 py-2 bg-red-500/10 border-l-4 border-red-500">
                    <span className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                      Urgent ({urgentItems.length})
                    </span>
                  </div>
                  {urgentItems.map((item, idx) => (
                    <AttentionRow key={`urgent-${idx}`} item={item} onCopy={() => copyDiagnostics(item)} />
                  ))}
                </div>
              )}

              {/* Warn section */}
              {warnItems.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-yellow-500/10 border-l-4 border-yellow-500">
                    <span className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">
                      Warning ({warnItems.length})
                    </span>
                  </div>
                  {warnItems.map((item, idx) => (
                    <AttentionRow key={`warn-${idx}`} item={item} onCopy={() => copyDiagnostics(item)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function AttentionRow({ item, onCopy }: { item: AttentionItem; onCopy: () => void }) {
  return (
    <div className={`px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
      item.attention_level === 'urgent' ? 'bg-red-500/5' : 'bg-yellow-500/5'
    }`}>
      {/* Row 1: Type badge + title + age */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <TypeBadge type={item.type} />
          <span className="text-sm font-medium text-white truncate">{item.title}</span>
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0">{formatAge(item.age_seconds)}</span>
      </div>

      {/* Row 2: Summary */}
      <div className="text-sm text-gray-400 mb-2 truncate" title={item.summary}>
        {item.summary}
      </div>

      {/* Row 3: Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={item.deep_link}
          className="px-3 py-1 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
        >
          View Details
        </Link>
        <button
          onClick={onCopy}
          className="px-3 py-1 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-400 rounded border border-gray-700 transition-colors"
        >
          Copy Diagnostics
        </button>
      </div>
    </div>
  );
}
