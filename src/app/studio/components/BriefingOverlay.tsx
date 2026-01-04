'use client';

import { useState, useCallback } from 'react';
import { X, Copy, RefreshCw, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';
import { buildBriefingScript, BriefingParams } from '@/lib/buildBriefingScript';

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
  const [copied, setCopied] = useState(false);
  const [timestamp, setTimestamp] = useState(() => new Date().toISOString());

  const briefingParams: BriefingParams = {
    projectName,
    projectId,
    projectSlug,
    devTeam,
    basePort,
    devSlot,
    pcTag,
    userName,
    timestamp,
  };

  const script = buildBriefingScript(briefingParams);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(script);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [script]);

  const handleRefresh = useCallback(() => {
    setTimestamp(new Date().toISOString());
    setCopied(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-white">External Claude Briefing Script</h2>
            <p className="text-sm text-white/80">Copy this into your external Claude session</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Script Content */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
            {script}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-2">
            {copied && (
              <span className="flex items-center gap-1 text-green-400 text-sm">
                <Check className="w-4 h-4" />
                Copied to clipboard!
              </span>
            )}
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
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
