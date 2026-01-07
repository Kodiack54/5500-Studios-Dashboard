'use client';

/**
 * ContextIndicator - Project dropdown + mode indicator in header
 *
 * Context Contract v1.0:
 * - Project dropdown sets stickyProject (persists across tabs)
 * - Mode is auto-derived from route (shown as pill)
 * - System tabs show "System mode" indicator
 */

import { useState, useEffect, useRef } from 'react';
import { Code2, Flame, Headphones, Map, Briefcase, Coffee, ChevronDown, Check } from 'lucide-react';
import { useUserContext, ContextMode, MODE_LABELS, StickyProject } from '@/app/contexts/UserContextProvider';

const MODE_ICONS: Record<ContextMode, React.ElementType> = {
  project: Code2,
  forge: Flame,
  support: Headphones,
  planning: Map,
  other: Briefcase,
  break: Coffee,
};

interface Project {
  id: string;
  slug: string;
  name: string;
}

export default function ContextIndicator() {
  const {
    context,
    hasActiveContext,
    isLoading,
    stickyProject,
    effectiveProject,
    resolvedMode,
    isSystemTab,
    setStickyProject,
  } = useUserContext();

  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch('/api/projects?parents_only=true');
        const data = await res.json();
        if (data.success && data.projects) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProject = (project: Project) => {
    setStickyProject({
      id: project.id,
      slug: project.slug,
      name: project.name,
    });
    setIsOpen(false);
  };

  const handleClearProject = () => {
    setStickyProject(null);
    setIsOpen(false);
  };

  const Icon = MODE_ICONS[resolvedMode] || Code2;

  // Display name for current selection
  const displayName = effectiveProject?.name || 'Select Project';

  if (isLoading) {
    return (
      <div className="w-56 h-10 flex items-center gap-2 px-3 bg-gray-700 rounded-xl text-sm border border-gray-600 text-gray-400">
        <div className="w-4 h-4 rounded-full bg-gray-600 animate-pulse flex-shrink-0" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 flex items-center gap-2 px-3 rounded-xl text-sm border transition-colors ${
          isSystemTab
            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
            : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
        }`}
      >
        {/* Project name */}
        <span className="font-medium truncate max-w-32">{displayName}</span>

        {/* Mode pill */}
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          resolvedMode === 'project' ? 'bg-blue-500/30 text-blue-300' :
          resolvedMode === 'forge' ? 'bg-orange-500/30 text-orange-300' :
          resolvedMode === 'support' ? 'bg-green-500/30 text-green-300' :
          resolvedMode === 'planning' ? 'bg-purple-500/30 text-purple-300' :
          'bg-gray-500/30 text-gray-300'
        }`}>
          {MODE_LABELS[resolvedMode]}
        </span>

        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* System tab indicator */}
      {isSystemTab && (
        <div className="absolute -bottom-5 left-0 text-xs text-amber-400/80 whitespace-nowrap">
          System mode
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-700 bg-gray-800/50">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Select Project</span>
          </div>

          {/* Project list */}
          <div className="max-h-64 overflow-y-auto">
            {loadingProjects ? (
              <div className="px-3 py-4 text-center text-gray-400 text-sm">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-400 text-sm">No projects found</div>
            ) : (
              <>
                {/* Clear selection option */}
                <button
                  onClick={handleClearProject}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors ${
                    !stickyProject ? 'bg-gray-700/50' : ''
                  }`}
                >
                  <span className="text-gray-400">—</span>
                  <span className="text-gray-300">No project</span>
                  {!stickyProject && <Check className="w-4 h-4 text-blue-400 ml-auto" />}
                </button>

                {/* Projects */}
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors ${
                      stickyProject?.id === project.id ? 'bg-gray-700/50' : ''
                    }`}
                  >
                    <Code2 className="w-4 h-4 text-gray-400" />
                    <span className="text-white truncate">{project.name}</span>
                    {stickyProject?.id === project.id && (
                      <Check className="w-4 h-4 text-blue-400 ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Footer - current mode info */}
          <div className="px-3 py-2 border-t border-gray-700 bg-gray-800/50">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Icon className="w-3 h-3" />
              <span>Mode: {MODE_LABELS[resolvedMode]} (auto)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
