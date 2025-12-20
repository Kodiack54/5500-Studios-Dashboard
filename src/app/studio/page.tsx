'use client';

/**
 * Studio Page - Basic Structure
 * Will bring over components from dev-studio-5000 piece by piece
 */

import { useState, useEffect, useContext } from 'react';
import { PageTitleContext, PageActionsContext } from '@/app/layout';
import { DraggableSidebar, SidebarItem } from './components';

// Sidebar items - same as dev-studio-5000
const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'files', icon: '📁', label: 'Files' },
  { id: 'terminal', icon: '💻', label: 'Terminal' },
  { id: 'ai-usage', icon: '💰', label: 'AI Usage' },
  { id: 'browser', icon: '🌐', label: 'Browser' },
  { id: 'schema', icon: '🗄️', label: 'DB Schema' },
  { id: 'chatlog', icon: '📜', label: 'Chat Log' },
  { id: 'hub', icon: '🎯', label: 'Session Hub' },
  { id: 'storage', icon: '💾', label: 'Storage' },
  { id: 'projects', icon: '⚙️', label: 'Projects' },
  { id: 'docs', icon: '📝', label: 'Docs' },
  { id: 'health', icon: '🩺', label: 'AI Health' },
];

export default function StudioPage() {
  const setPageTitle = useContext(PageTitleContext);
  const setPageActions = useContext(PageActionsContext);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle({
      title: 'Studio',
      description: 'Development environment with Claude AI'
    });
    return () => {
      setPageTitle({ title: '', description: '' });
      setPageActions(null);
    };
  }, [setPageTitle, setPageActions]);

  return (
    <div className="h-full flex bg-gray-900">
      {/* Icon Sidebar */}
      <div className="w-14 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-2 flex-shrink-0">
        <DraggableSidebar
          items={SIDEBAR_ITEMS}
          activePanel={activePanel}
          onPanelChange={setActivePanel}
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Main content area (browser/panels will go here) */}
        <div className="flex-1 flex items-center justify-center border-r border-gray-700">
          <div className="text-gray-600 text-sm">
            Main content area - will import BrowserPage from dev-studio-5000
          </div>
        </div>

        {/* Right: Claude Terminal area */}
        <div className="w-[400px] bg-gray-850 flex flex-col flex-shrink-0">
          <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-3">
            <span className="text-sm font-medium text-white">Claude Terminal</span>
            <span className="ml-2 w-2 h-2 rounded-full bg-red-500" title="Disconnected"></span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-600 text-sm text-center px-4">
              Terminal area - will import ClaudeTerminal from dev-studio-5000
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
