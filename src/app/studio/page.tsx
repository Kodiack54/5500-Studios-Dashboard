'use client';

/**
 * Studio Page - Development Environment
 * Includes browser preview with project/environment selection
 */

import { useState, useEffect, useContext } from 'react';
import { PageTitleContext, PageActionsContext } from '@/app/layout';
import { DraggableSidebar, SidebarItem } from './components';
import BrowserPage from './browser/BrowserPage';
import type { Project, Environment } from '@/types';
import { ENVIRONMENTS } from '@/types';

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
  const [activePanel, setActivePanel] = useState<string | null>('browser');

  // Project and environment state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<Environment>(ENVIRONMENTS[0]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Fetch projects on mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.success && data.projects) {
          setProjects(data.projects);
          // Auto-select first project
          if (data.projects.length > 0) {
            setSelectedProject(data.projects[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    }
    fetchProjects();
  }, []);

  useEffect(() => {
    setPageTitle({
      title: 'Studio',
      description: 'Development environment with Claude AI'
    });

    // Add project/environment selectors as page actions
    setPageActions(
      <div className="flex items-center gap-2">
        {/* Project Dropdown */}
        <select
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const project = projects.find(p => p.id === e.target.value);
            setSelectedProject(project || null);
          }}
          className="bg-black/20 text-white text-sm px-3 py-1.5 rounded-lg border border-black/30 focus:outline-none focus:ring-2 focus:ring-white/30"
          disabled={isLoadingProjects}
        >
          {isLoadingProjects ? (
            <option>Loading...</option>
          ) : projects.length === 0 ? (
            <option>No projects</option>
          ) : (
            projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))
          )}
        </select>

        {/* Environment Dropdown */}
        <select
          value={selectedEnv.id}
          onChange={(e) => {
            const env = ENVIRONMENTS.find(env => env.id === e.target.value);
            if (env) setSelectedEnv(env);
          }}
          className="bg-black/20 text-white text-sm px-3 py-1.5 rounded-lg border border-black/30 focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          {ENVIRONMENTS.map(env => (
            <option key={env.id} value={env.id}>{env.name}</option>
          ))}
        </select>
      </div>
    );

    return () => {
      setPageTitle({ title: '', description: '' });
      setPageActions(null);
    };
  }, [setPageTitle, setPageActions, projects, selectedProject, selectedEnv, isLoadingProjects]);

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
        {/* Left: Browser/Panel content area */}
        <div className="flex-1 flex flex-col border-r border-gray-700">
          {activePanel === 'browser' ? (
            <BrowserPage
              project={selectedProject}
              env={selectedEnv}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              {activePanel ? `${activePanel} panel - coming soon` : 'Select a panel from the sidebar'}
            </div>
          )}
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
