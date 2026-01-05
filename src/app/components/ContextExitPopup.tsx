'use client';

/**
 * ContextExitPopup - Shows when user tries to leave Dashboard
 *
 * Simple popup: "Welcome back [user] - what are we working on today?"
 * Project dropdown + "Other" button.
 * Dark theme, minimal styling.
 */

import { useState, useEffect } from 'react';
import { Briefcase } from 'lucide-react';
import { useUserContext } from '@/app/contexts/UserContextProvider';
import { useUser } from '@/app/settings/UserContext';

interface Project {
  id: string;
  slug: string;
  name: string;
}

interface ContextExitPopupProps {
  onClose: () => void;
  onContextSet: () => void;
}

export default function ContextExitPopup({ onClose, onContextSet }: ContextExitPopupProps) {
  const { setContext } = useUserContext();
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.success && data.projects) {
          setProjects(data.projects);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleProjectSelect = async () => {
    if (!selectedProject) return;

    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;

    const success = await setContext({
      mode: 'project',
      project_id: project.id,
      project_slug: project.slug,
      source: 'manual',
    });

    if (success) {
      onContextSet();
    }
  };

  const handleOther = async () => {
    const success = await setContext({
      mode: 'other',
      source: 'manual',
    });

    if (success) {
      onContextSet();
    }
  };

  const userName = user?.email?.split('@')[0] || 'there';
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-800 rounded-xl shadow-2xl p-6 w-96 border border-gray-700">
        {/* Header */}
        <h2 className="text-lg font-semibold text-white mb-4">
          Welcome back {displayName} — what are we working on today?
        </h2>

        {/* Project Dropdown */}
        <div className="mb-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">Select a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name || project.slug}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Start Project Button */}
          <button
            onClick={handleProjectSelect}
            disabled={!selectedProject}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Start
          </button>

          {/* Other Button */}
          <button
            onClick={handleOther}
            className="flex items-center gap-2 bg-gray-700 text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-600 hover:text-white transition-colors border border-gray-600"
          >
            <Briefcase className="w-4 h-4" />
            Other
          </button>
        </div>
      </div>
    </>
  );
}
