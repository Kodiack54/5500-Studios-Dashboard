'use client';

/**
 * Studio Page - Main Development Environment
 * Location: kodiack-dashboard-5500/src/app/studio/page.tsx
 *
 * This is the Studio tab content that integrates into the dashboard.
 * Features:
 * - Icon sidebar (draggable, reorderable)
 * - Browser panel (main content area)
 * - Claude terminal interface
 * - Pop-out panels for Files, Terminal, Schema, etc.
 */

import { useState, useEffect, useContext } from 'react';
import { PageTitleContext, PageActionsContext } from '@/app/layout';
import { DraggableSidebar, SidebarItem, ClaudeTerminal } from './components';

// Panel types for the sidebar
type PanelType = 'projects' | 'browser' | 'files' | 'terminal' | 'schema' | 'chatlog' | 'hub' | 'storage' | 'docs' | 'health' | 'ai-usage' | null;

// Sidebar items configuration
const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'projects', icon: '⚙️', label: 'Projects' },
  { id: 'browser', icon: '🌐', label: 'Browser' },
  { id: 'files', icon: '📁', label: 'Files' },
  { id: 'terminal', icon: '💻', label: 'Terminal' },
  { id: 'schema', icon: '🗄️', label: 'DB Schema' },
  { id: 'chatlog', icon: '📜', label: 'Chat Log' },
  { id: 'hub', icon: '🎯', label: 'Session Hub' },
  { id: 'storage', icon: '💾', label: 'Storage' },
  { id: 'docs', icon: '📝', label: 'Docs' },
  { id: 'health', icon: '🩺', label: 'AI Health' },
  { id: 'ai-usage', icon: '💰', label: 'AI Usage' },
];

export default function StudioPage() {
  const setPageTitle = useContext(PageTitleContext);
  const setPageActions = useContext(PageActionsContext);
  const [activePanel, setActivePanel] = useState<PanelType>('browser');

  // Set page title
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
          onPanelChange={(panel) => setActivePanel(panel as PanelType)}
        />
      </div>

      {/* Pop-out Panel - Shows when a sidebar item is clicked (except browser/projects) */}
      {activePanel && activePanel !== 'projects' && activePanel !== 'browser' && activePanel !== 'hub' && (
        <div className="w-72 bg-gray-850 border-r border-gray-700 flex flex-col flex-shrink-0">
          <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
            <span className="text-sm font-medium text-white flex items-center gap-2">
              {activePanel === 'files' && '📁 File Manager'}
              {activePanel === 'terminal' && '💻 Terminal'}
              {activePanel === 'ai-usage' && '💰 AI Usage'}
              {activePanel === 'schema' && '🗄️ DB Schema'}
              {activePanel === 'chatlog' && '📜 Chat Log'}
              {activePanel === 'storage' && '💾 Storage Monitor'}
              {activePanel === 'health' && '🩺 AI Health'}
              {activePanel === 'docs' && '📝 Docs'}
            </span>
            <button
              onClick={() => setActivePanel('browser')}
              className="text-gray-500 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {/* Panel content placeholders - will be replaced with actual panels */}
            <div className="text-gray-500 text-sm">
              {activePanel} panel content
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <select className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm">
              <option>Kodiack Dashboard</option>
              <option>NextBid Engine</option>
              <option>NextBid Portal</option>
            </select>
            <select className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm">
              <option>Development</option>
              <option>Testing</option>
              <option>Production</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">
              🔓 Lock Project
            </button>
          </div>
        </div>

        {/* Main Split View - Browser + Terminal */}
        <div className="flex-1 flex overflow-hidden">
          {/* Browser/Project Panel - 2/3 width */}
          <div className="flex-[2] min-w-0 flex flex-col border-r border-gray-700 bg-gray-900">
            {activePanel === 'projects' ? (
              <div className="flex-1 overflow-auto p-4">
                <div className="text-center text-gray-500 py-12">
                  <div className="text-4xl mb-4">⚙️</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Project Management</h3>
                  <p className="text-sm">Manage your projects, settings, and configurations</p>
                </div>
              </div>
            ) : activePanel === 'hub' ? (
              <div className="flex-1 overflow-auto p-4">
                <div className="text-center text-gray-500 py-12">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Session Hub</h3>
                  <p className="text-sm">View and manage your development sessions</p>
                </div>
              </div>
            ) : (
              /* Browser Panel */
              <div className="flex-1 flex flex-col">
                {/* Browser URL Bar */}
                <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center gap-2 px-3">
                  <button className="text-gray-400 hover:text-white">←</button>
                  <button className="text-gray-400 hover:text-white">→</button>
                  <button className="text-gray-400 hover:text-white">↻</button>
                  <div className="flex-1 bg-gray-700 rounded-lg px-3 py-1 text-sm text-gray-300">
                    http://localhost:5500
                  </div>
                </div>
                {/* Browser Content */}
                <div className="flex-1 bg-gray-900 overflow-hidden flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">🌐</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Project Preview</h3>
                    <p className="text-sm mb-4">Select a project and environment to preview</p>
                    <p className="text-xs text-gray-600">Browser preview will load the selected project's dev server</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Claude Terminal - 1/3 width */}
          <div className="w-[400px] min-w-[300px] h-full flex-shrink-0">
            <ClaudeTerminal />
          </div>
        </div>
      </div>
    </div>
  );
}
