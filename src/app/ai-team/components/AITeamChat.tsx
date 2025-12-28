'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';

/**
 * AITeamChat - Chat with AI workers
 * Placeholder for now - will be implemented later
 */
export default function AITeamChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-gray-700 text-white rounded-xl flex items-center justify-center hover:bg-gray-600 transition-colors"
        title="AI Team Chat"
      >
        <Bot className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-medium">AI Team Chat</h3>
              <p className="text-gray-400 text-sm">Chat with AI workers</p>
            </div>
            <div className="p-4 text-gray-500 text-sm text-center">
              Coming soon...
            </div>
          </div>
        </>
      )}
    </div>
  );
}
