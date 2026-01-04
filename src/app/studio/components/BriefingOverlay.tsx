'use client';

import { useState, useCallback, useMemo } from 'react';
import { X, Copy, RefreshCw, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';
import { buildBriefingScript, BriefingParams } from '@/lib/buildBriefingScript';
import { buildChatgptSyncScript } from '@/lib/buildChatgptSyncScript';

type TabType = 'claude' | 'chatgpt';

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
  const [activeTab, setActiveTab] = useState<TabType>('claude');
  const [copied, setCopied] = useState(false);
  const [timestamp, setTimestamp] = useState(() => new Date().toISOString());

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

  const activeScript = activeTab === 'claude' ? claudeScript : chatgptScript;

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(activeScript);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [activeScript]);

  const handleRefresh = useCallback(() => {
    setTimestamp(new Date().toISOString());
    setCopied(false);
  }, []);

  if (!isOpen) return null;

  const tabConfig = {
    claude: {
      title: 'External Claude',
      description: 'Copy this into your external Claude session',
      gradient: 'from-blue-600 to-cyan-600',
    },
    chatgpt: {
      title: 'ChatGPT Sync',
      description: 'Get verifiable sync payload to paste into ChatGPT',
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
              onClick={() => setActiveTab('claude')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'claude'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              External Claude
            </button>
            <button
              onClick={() => setActiveTab('chatgpt')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chatgpt'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              ChatGPT Sync
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
            <h2 className="text-lg font-bold text-white">{currentTab.title} Briefing Script</h2>
            <p className="text-sm text-white/80">{currentTab.description}</p>
          </div>
        </div>

        {/* Script Content */}
        <div className="flex-1 overflow-auto p-4 min-h-0">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto max-h-[50vh] overflow-y-auto">
            {activeScript}
          </pre>
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                activeTab === 'claude'
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-green-600 hover:bg-green-500'
              }`}
            >
              <Copy className="w-4 h-4" />
              Copy to Clipboard
            </button>
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
