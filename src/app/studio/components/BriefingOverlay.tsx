'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Copy, RefreshCw, Check, Loader2, Database } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';
import { buildBriefingScript, BriefingParams } from '@/lib/buildBriefingScript';
import { buildChatgptSyncScript } from '@/lib/buildChatgptSyncScript';

type TabType = 'claude' | 'chatgpt' | 'packet';

interface BriefingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId: string;
  projectSlug?: string;
  devTeam: string;
  basePort: number;
  devSlot: string;
  pcTag: string;
  userName: string;
}

interface ServerPacket {
  briefingPacket: string;
  chatgptSyncPayload: string;
  rawData: Record<string, unknown>;
}

export function BriefingOverlay({
  isOpen,
  onClose,
  projectName,
  projectId,
  projectSlug,
  devTeam,
  basePort,
  devSlot,
  pcTag,
  userName,
}: BriefingOverlayProps) {
  const [activeTab, setActiveTab] = useState<TabType>('packet');
  const [copied, setCopied] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(() => new Date().toISOString());

  // Server-generated packet state
  const [serverPacket, setServerPacket] = useState<ServerPacket | null>(null);
  const [packetLoading, setPacketLoading] = useState(false);
  const [packetError, setPacketError] = useState<string | null>(null);

  const briefingParams: BriefingParams = useMemo(() => ({
    projectName,
    projectId,
    projectSlug,
    devTeam,
    basePort,
    devSlot,
    pcTag,
    userName,
    timestamp,
  }), [projectName, projectId, projectSlug, devTeam, basePort, devSlot, pcTag, userName, timestamp]);

  const claudeScript = useMemo(() => buildBriefingScript(briefingParams), [briefingParams]);
  const chatgptScript = useMemo(() => buildChatgptSyncScript(briefingParams), [briefingParams]);

  // Fetch server packet
  const fetchServerPacket = useCallback(async () => {
    if (!projectId) return;

    setPacketLoading(true);
    setPacketError(null);

    try {
      const res = await fetch('/api/studio/project-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          teamId: devTeam,
          basePort,
          devSlot,
          pcTag,
          userName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setServerPacket({
          briefingPacket: data.briefingPacket,
          chatgptSyncPayload: data.chatgptSyncPayload,
          rawData: data.rawData,
        });
      } else {
        setPacketError(data.error || 'Failed to generate packet');
      }
    } catch (err) {
      setPacketError('Network error fetching packet');
      console.error('[BriefingOverlay] Packet fetch error:', err);
    } finally {
      setPacketLoading(false);
    }
  }, [projectId, devTeam, basePort, devSlot, pcTag, userName]);

  // Fetch packet on open and when tab is packet
  useEffect(() => {
    if (isOpen && activeTab === 'packet' && !serverPacket && !packetLoading) {
      fetchServerPacket();
    }
  }, [isOpen, activeTab, serverPacket, packetLoading, fetchServerPacket]);

  // Get active content based on tab
  const getActiveContent = () => {
    if (activeTab === 'claude') return claudeScript;
    if (activeTab === 'chatgpt') return chatgptScript;
    if (activeTab === 'packet') {
      return serverPacket?.briefingPacket || '';
    }
    return '';
  };

  const handleCopy = useCallback(async (content?: string, label?: string) => {
    const textToCopy = content || getActiveContent();
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopied(label || 'main');
      setTimeout(() => setCopied(null), 2000);
    }
  }, [getActiveContent]);

  const handleRefresh = useCallback(() => {
    setTimestamp(new Date().toISOString());
    setCopied(null);
    if (activeTab === 'packet') {
      setServerPacket(null);
      fetchServerPacket();
    }
  }, [activeTab, fetchServerPacket]);

  if (!isOpen) return null;

  const tabConfig = {
    packet: {
      title: 'Project Briefing Packet',
      description: 'Server-generated briefing from live database (no Claude calls)',
      gradient: 'from-purple-600 to-pink-600',
    },
    claude: {
      title: 'External Claude Prompt',
      description: 'Paste this prompt into external Claude to generate briefing',
      gradient: 'from-blue-600 to-cyan-600',
    },
    chatgpt: {
      title: 'ChatGPT Sync Prompt',
      description: 'Paste this prompt into ChatGPT to sync project context',
      gradient: 'from-green-600 to-emerald-600',
    },
  };

  const currentTab = tabConfig[activeTab];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-700">
        {/* Header with Tabs */}
        <div className={`flex flex-col rounded-t-xl bg-gradient-to-r ${currentTab.gradient}`}>
          {/* Tab Buttons */}
          <div className="flex border-b border-white/20">
            <button
              onClick={() => setActiveTab('packet')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'packet'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              Packet (Live)
            </button>
            <button
              onClick={() => setActiveTab('claude')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'claude'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              Claude Prompt
            </button>
            <button
              onClick={() => setActiveTab('chatgpt')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chatgpt'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              ChatGPT Prompt
            </button>
            <button
              onClick={onClose}
              className="px-4 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tab Title */}
          <div className="px-6 py-4">
            <h2 className="text-lg font-bold text-white">{currentTab.title}</h2>
            <p className="text-sm text-white/80">{currentTab.description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 min-h-0">
          {activeTab === 'packet' ? (
            // Server packet tab
            packetLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <span className="ml-3 text-gray-400">Generating briefing packet...</span>
              </div>
            ) : packetError ? (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
                <p className="font-medium">Error generating packet</p>
                <p className="text-sm mt-1">{packetError}</p>
                <button
                  onClick={fetchServerPacket}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : serverPacket ? (
              <div className="space-y-4">
                {/* Briefing Packet */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-300">Briefing Packet</h3>
                    <button
                      onClick={() => handleCopy(serverPacket.briefingPacket, 'packet')}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded"
                    >
                      {copied === 'packet' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === 'packet' ? 'Copied!' : 'Copy Packet'}
                    </button>
                  </div>
                  <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-[35vh] overflow-y-auto">
                    {serverPacket.briefingPacket}
                  </pre>
                </div>

                {/* ChatGPT Sync Payload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-300">ChatGPT Sync Payload</h3>
                    <button
                      onClick={() => handleCopy(serverPacket.chatgptSyncPayload, 'sync')}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded"
                    >
                      {copied === 'sync' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === 'sync' ? 'Copied!' : 'Copy Sync Payload'}
                    </button>
                  </div>
                  <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-[25vh] overflow-y-auto">
                    {serverPacket.chatgptSyncPayload}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Click Refresh to generate packet
              </div>
            )
          ) : (
            // Claude/ChatGPT prompt tabs
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto max-h-[50vh] overflow-y-auto">
              {getActiveContent()}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/50 rounded-b-xl">
          <div className="flex items-center gap-2">
            {copied && (
              <span className="flex items-center gap-1 text-green-400 text-sm">
                <Check className="w-4 h-4" />
                Copied to clipboard!
              </span>
            )}
            <span className="text-xs text-gray-500">
              {projectName} • {devTeam} • Slot {devSlot}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={packetLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${packetLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {activeTab !== 'packet' && (
              <button
                onClick={() => handleCopy()}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  activeTab === 'claude'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 border border-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              I've Pasted This (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
