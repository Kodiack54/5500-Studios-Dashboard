'use client';

/**
 * ContextGateModal - Blocks UI until user selects their context
 *
 * This is the entry point for truth enforcement. User cannot
 * navigate anywhere until they declare what they're doing.
 *
 * Options:
 * - Project (requires project selection)
 * - Forge (thinking/planning, no project)
 * - Helpdesk (support, no project)
 * - Ops (admin, no project)
 * - Roadmap (planning, no project)
 * - Meeting (no project)
 * - Break (no project)
 */

import { useState, useEffect } from 'react';
import { Loader2, Code2, Hammer, Headphones, Settings, Map, Users, Coffee, ChevronRight } from 'lucide-react';
import { useUserContext, ContextMode, MODE_LABELS } from '../contexts/UserContextProvider';

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface ContextGateModalProps {
  projects: Project[];
  onContextSet?: () => void;
}

const CONTEXT_OPTIONS: { mode: ContextMode; label: string; icon: React.ElementType; color: string; description: string }[] = [
  {
    mode: 'project',
    label: 'Project',
    icon: Code2,
    color: 'bg-sky-600 hover:bg-sky-500',
    description: 'Work on a specific project with full context',
  },
  {
    mode: 'forge',
    label: 'Forge',
    icon: Hammer,
    color: 'bg-orange-600 hover:bg-orange-500',
    description: 'Thinking, planning, exploring - no specific project',
  },
  {
    mode: 'helpdesk',
    label: 'Helpdesk',
    icon: Headphones,
    color: 'bg-green-600 hover:bg-green-500',
    description: 'Customer support and ticket handling',
  },
  {
    mode: 'ops',
    label: 'Ops',
    icon: Settings,
    color: 'bg-purple-600 hover:bg-purple-500',
    description: 'Server management and admin tasks',
  },
  {
    mode: 'roadmap',
    label: 'Roadmap',
    icon: Map,
    color: 'bg-indigo-600 hover:bg-indigo-500',
    description: 'Planning and prioritization',
  },
  {
    mode: 'meeting',
    label: 'Meeting',
    icon: Users,
    color: 'bg-yellow-600 hover:bg-yellow-500',
    description: 'In a meeting or call',
  },
  {
    mode: 'break',
    label: 'Break',
    icon: Coffee,
    color: 'bg-gray-600 hover:bg-gray-500',
    description: 'Taking a break',
  },
];

const DEV_TEAMS = [
  { id: 'dev1', label: 'Dev Team 1', port: '5410' },
  { id: 'dev2', label: 'Dev Team 2', port: '5420' },
  { id: 'dev3', label: 'Dev Team 3', port: '5430' },
];

export default function ContextGateModal({ projects, onContextSet }: ContextGateModalProps) {
  const { setContext, showContextGate } = useUserContext();

  const [selectedMode, setSelectedMode] = useState<ContextMode | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDevTeam, setSelectedDevTeam] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'mode' | 'project' | 'team'>('mode');

  // Reset when modal opens
  useEffect(() => {
    if (showContextGate) {
      setSelectedMode(null);
      setSelectedProject(null);
      setSelectedDevTeam(null);
      setStep('mode');
    }
  }, [showContextGate]);

  if (!showContextGate) return null;

  const handleModeSelect = (mode: ContextMode) => {
    setSelectedMode(mode);
    if (mode === 'project') {
      setStep('project');
    } else {
      // Non-project modes can submit directly
      handleSubmit(mode);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setStep('team');
  };

  const handleTeamSelect = async (teamId: string | null) => {
    setSelectedDevTeam(teamId);
    if (selectedMode && selectedProject) {
      await handleSubmit(selectedMode, selectedProject, teamId);
    }
  };

  const handleSubmit = async (
    mode: ContextMode,
    project?: Project | null,
    devTeam?: string | null
  ) => {
    setIsSubmitting(true);

    const success = await setContext({
      mode,
      project_id: project?.id || null,
      project_slug: project?.slug || null,
      dev_team: devTeam || null,
      source: 'universal',
    });

    setIsSubmitting(false);

    if (success) {
      onContextSet?.();
    }
  };

  const handleBack = () => {
    if (step === 'team') {
      setStep('project');
      setSelectedDevTeam(null);
    } else if (step === 'project') {
      setStep('mode');
      setSelectedProject(null);
      setSelectedMode(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {step === 'mode' && 'What are you working on?'}
            {step === 'project' && 'Select Project'}
            {step === 'team' && 'Select Dev Team (Optional)'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {step === 'mode' && 'Choose your context to get started. This helps track your work accurately.'}
            {step === 'project' && 'Select the project you\'ll be working on.'}
            {step === 'team' && 'Optionally select a dev team for terminal access.'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitting ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <span className="ml-3 text-gray-400">Setting context...</span>
            </div>
          ) : step === 'mode' ? (
            <div className="grid grid-cols-2 gap-3">
              {CONTEXT_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.mode}
                    onClick={() => handleModeSelect(option.mode)}
                    className={`flex items-start gap-3 p-4 rounded-xl text-left text-white transition-all ${option.color} group`}
                  >
                    <Icon className="w-6 h-6 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-2">
                        {option.label}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs text-white/70 mt-0.5">{option.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : step === 'project' ? (
            <div className="space-y-3">
              <button
                onClick={handleBack}
                className="text-sm text-gray-400 hover:text-white mb-2"
              >
                &larr; Back to modes
              </button>
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Code2 className="w-5 h-5 text-sky-400" />
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-gray-400">{project.slug}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : step === 'team' ? (
            <div className="space-y-3">
              <button
                onClick={handleBack}
                className="text-sm text-gray-400 hover:text-white mb-2"
              >
                &larr; Back to projects
              </button>
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-400">Selected project:</div>
                <div className="text-white font-medium">{selectedProject?.name}</div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {DEV_TEAMS.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleTeamSelect(team.id)}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-800 hover:bg-sky-600 text-white transition-colors group"
                  >
                    <div>
                      <div className="font-medium">{team.label}</div>
                      <div className="text-xs text-gray-400 group-hover:text-white/70">Port {team.port}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                  </button>
                ))}
                <button
                  onClick={() => handleTeamSelect(null)}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                >
                  <div>
                    <div className="font-medium">No Team</div>
                    <div className="text-xs text-gray-400">Skip dev team selection</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Your context determines how your work is tracked. You can change it anytime from the header.
          </p>
        </div>
      </div>
    </div>
  );
}
