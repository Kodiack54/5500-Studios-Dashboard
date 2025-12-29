'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle, Circle } from 'lucide-react';
import { Project, ProjectStats, Phase, PhaseItem } from '../types';
import KpiPanel from './KpiPanel';

interface PreviewTodo {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface PreviewBug {
  id: string;
  title: string;
  severity: string;
  status: string;
}

interface PreviewDoc {
  id: string;
  name: string;
  doc_type: string;
}

interface PreviewKnowledge {
  id: string;
  title: string;
  category: string;
}

interface PreviewPhase extends Phase {
  items: PhaseItem[];
}

interface ProjectPreviewPanelProps {
  project: Project | null;
  stats: ProjectStats;
  onOpenProject: (project: Project) => void;
}

/**
 * Right panel showing project preview with KPIs, todos, bugs, docs, knowledge
 */
export default function ProjectPreviewPanel({
  project,
  stats,
  onOpenProject,
}: ProjectPreviewPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['phases', 'todos', 'docs']));
  const [previewTodos, setPreviewTodos] = useState<PreviewTodo[]>([]);
  const [previewBugs, setPreviewBugs] = useState<PreviewBug[]>([]);
  const [previewDocs, setPreviewDocs] = useState<PreviewDoc[]>([]);
  const [previewKnowledge, setPreviewKnowledge] = useState<PreviewKnowledge[]>([]);
  const [currentPhase, setCurrentPhase] = useState<PreviewPhase | null>(null);

  // Fetch preview data when project changes
  useEffect(() => {
    if (!project) {
      setPreviewTodos([]);
      setPreviewBugs([]);
      setPreviewDocs([]);
      setPreviewKnowledge([]);
      setCurrentPhase(null);
      return;
    }

    const projectPath = project.server_path || '';

    const fetchData = async () => {
      try {
        const [docsRes, todosRes, knowledgeRes, bugsRes] = await Promise.all([
          fetch(`/project-management/api/docs?project_path=${encodeURIComponent(projectPath)}`),
          fetch(`/project-management/api/todos?project_path=${encodeURIComponent(projectPath)}`),
          fetch(`/project-management/api/knowledge?project_path=${encodeURIComponent(projectPath)}`),
          fetch(`/project-management/api/bugs?project_path=${encodeURIComponent(projectPath)}`),
        ]);

        const [docsData, todosData, knowledgeData, bugsData] = await Promise.all([
          docsRes.json(),
          todosRes.json(),
          knowledgeRes.json(),
          bugsRes.json(),
        ]);

        if (docsData.success && docsData.docs) {
          setPreviewDocs(docsData.docs.slice(0, 10));
        }

        if (todosData.success && todosData.todos) {
          const sorted = todosData.todos.sort((a: PreviewTodo, b: PreviewTodo) => {
            const order: Record<string, number> = { in_progress: 0, pending: 1, completed: 2 };
            return (order[a.status] || 3) - (order[b.status] || 3);
          });
          setPreviewTodos(sorted.slice(0, 10));
        }

        if (knowledgeData.success && knowledgeData.knowledge) {
          setPreviewKnowledge(knowledgeData.knowledge.slice(0, 8));
        }

        if (bugsData.success && bugsData.bugs) {
          const activeBugs = bugsData.bugs.filter((b: PreviewBug) => b.status !== 'resolved');
          setPreviewBugs(activeBugs.slice(0, 5));
        }

        // Fetch phases for parent projects
        if (project.is_parent) {
          const phasesRes = await fetch(`/project-management/api/phases/${project.id}`);
          const phasesData = await phasesRes.json();

          if (phasesData.success && phasesData.phases) {
            // Find the current phase (in_progress) or first pending phase
            const current = phasesData.phases.find((p: Phase) => p.status === 'in_progress')
              || phasesData.phases.find((p: Phase) => p.status === 'pending');

            if (current) {
              // Fetch items for the current phase
              const itemsRes = await fetch(`/project-management/api/phase-items?phase_id=${current.id}`);
              const itemsData = await itemsRes.json();

              setCurrentPhase({
                ...current,
                items: itemsData.success ? itemsData.items : [],
              });
            }
          }
        } else {
          setCurrentPhase(null);
        }
      } catch (error) {
        console.error('Error fetching preview data:', error);
      }
    };

    fetchData();
  }, [project]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (!project) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/50 border-dashed rounded-lg p-8 text-center">
        <div className="text-gray-600 text-sm mb-2">Select a project</div>
        <div className="text-gray-500 text-xs">Click any project to see KPIs and details</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* Project Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-gray-800 sticky top-0">
        {project.logo_url ? (
          <img src={project.logo_url} alt={project.name} className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 text-xl font-bold">
            {project.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-white font-semibold">{project.name}</h3>
          <div className="flex items-center gap-2">
            {project.is_parent && (
              <span className="text-xs text-purple-400">Parent</span>
            )}
            {project.description && (
              <span className="text-xs text-gray-500 truncate max-w-[180px]">{project.description}</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="p-4 border-b border-gray-700">
        <KpiPanel stats={stats} variant="compact" />
      </div>

      {/* Collapsible Sections */}
      <div className="divide-y divide-gray-700">
        {/* Current Phase Section (Parent Projects Only) */}
        {currentPhase && (
          <div>
            <button
              onClick={() => toggleSection('phases')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                Phase {currentPhase.phase_num}: {currentPhase.name}
                <span className="text-xs text-gray-500">
                  ({currentPhase.items.filter(i => i.status === 'completed').length}/{currentPhase.items.length})
                </span>
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.has('phases') ? '' : '-rotate-90'}`} />
            </button>
            {expandedSections.has('phases') && currentPhase.items.length > 0 && (
              <div className="px-3 pb-3 space-y-1">
                {/* Progress bar */}
                <div className="mb-2">
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all"
                      style={{
                        width: `${currentPhase.items.length > 0
                          ? Math.round((currentPhase.items.filter(i => i.status === 'completed').length / currentPhase.items.length) * 100)
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
                {currentPhase.items.slice(0, 7).map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm p-2 bg-gray-900 rounded">
                    {item.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}
                    <span className={`truncate flex-1 ${item.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                      {item.title}
                    </span>
                  </div>
                ))}
                {currentPhase.items.length > 7 && (
                  <div className="text-center text-gray-500 text-xs py-1">
                    +{currentPhase.items.length - 7} more items
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Todos Section */}
        <div>
          <button
            onClick={() => toggleSection('todos')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Active Todos
              <span className="text-xs text-gray-500">({previewTodos.length})</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.has('todos') ? '' : '-rotate-90'}`} />
          </button>
          {expandedSections.has('todos') && previewTodos.length > 0 && (
            <div className="px-3 pb-3 space-y-1">
              {previewTodos.map(todo => (
                <div key={todo.id} className="flex items-center gap-2 text-sm p-2 bg-gray-900 rounded">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    todo.status === 'in_progress' ? 'bg-blue-400 animate-pulse' :
                    todo.status === 'completed' ? 'bg-green-400' : 'bg-gray-500'
                  }`} />
                  <span className="text-gray-300 truncate flex-1">{todo.title}</span>
                  {todo.priority === 'high' && <span className="text-red-400 text-xs font-bold">!</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bugs Section */}
        {previewBugs.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('bugs')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                Open Bugs
                <span className="text-xs text-gray-500">({previewBugs.length})</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.has('bugs') ? '' : '-rotate-90'}`} />
            </button>
            {expandedSections.has('bugs') && (
              <div className="px-3 pb-3 space-y-1">
                {previewBugs.map(bug => (
                  <div key={bug.id} className="flex items-center gap-2 text-sm p-2 bg-gray-900 rounded">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      bug.severity === 'critical' ? 'bg-red-600 text-white' :
                      bug.severity === 'high' ? 'bg-orange-600 text-white' :
                      'bg-yellow-600 text-black'
                    }`}>{bug.severity}</span>
                    <span className="text-gray-300 truncate flex-1">{bug.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Docs Section */}
        <div>
          <button
            onClick={() => toggleSection('docs')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Documentation
              <span className="text-xs text-gray-500">({previewDocs.length})</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.has('docs') ? '' : '-rotate-90'}`} />
          </button>
          {expandedSections.has('docs') && previewDocs.length > 0 && (
            <div className="px-3 pb-3 space-y-1">
              {previewDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 text-sm p-2 bg-gray-900 rounded">
                  <span className="px-1.5 py-0.5 bg-green-600/20 text-green-400 rounded text-[10px]">{doc.doc_type || 'doc'}</span>
                  <span className="text-gray-300 truncate flex-1">{doc.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Knowledge Section */}
        <div>
          <button
            onClick={() => toggleSection('knowledge')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Knowledge Base
              <span className="text-xs text-gray-500">({previewKnowledge.length})</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.has('knowledge') ? '' : '-rotate-90'}`} />
          </button>
          {expandedSections.has('knowledge') && previewKnowledge.length > 0 && (
            <div className="px-3 pb-3 space-y-1">
              {previewKnowledge.map(k => (
                <div key={k.id} className="flex items-center gap-2 text-sm p-2 bg-gray-900 rounded">
                  <span className="px-1.5 py-0.5 bg-purple-600/20 text-purple-400 rounded text-[10px]">{k.category || 'note'}</span>
                  <span className="text-gray-300 truncate flex-1">{k.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Project Button */}
      <div className="p-4 border-t border-gray-700 bg-gray-800 sticky bottom-0">
        <button
          onClick={() => onOpenProject(project)}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Open Project →
        </button>
      </div>
    </div>
  );
}
