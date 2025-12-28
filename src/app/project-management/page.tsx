'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, ArrowLeft, ChevronRight, ChevronDown, Settings, GripVertical, Building2 } from 'lucide-react';
import { useClient } from '@/app/contexts/ClientContext';
import { Project, TabType, TABS } from './types';
import ProjectHeader from './components/ProjectHeader';
import ProjectTabs from './components/ProjectTabs';
import ProjectForm from './components/ProjectForm';

// Drag and Drop
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Tab Components
import TodosTab from './tabs/TodosTab';
import DocsTab from './tabs/DocsTab';
import DatabaseTab from './tabs/DatabaseTab';
import StructureTab from './tabs/StructureTab';
import ConventionsTab from './tabs/ConventionsTab';
import NotepadTab from './tabs/NotepadTab';
import BugsTab from './tabs/BugsTab';
import KnowledgeTab from './tabs/KnowledgeTab';

// Environment color config
const ENV_COLORS = {
  dev: { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-500', label: 'Dev' },
  test: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', border: 'border-yellow-500', label: 'Test' },
  prod: { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-500', label: 'Prod' },
};

// Detect environment from parent port configuration or project name
function detectEnvironment(project: Project, parent?: Project): 'dev' | 'test' | 'prod' | null {
  // If this is a child with a parent, check if child's port matches parent's port slots
  if (parent) {
    const childPort = project.port_dev || project.port_test || project.port_prod;
    if (childPort) {
      if (parent.port_dev && childPort === parent.port_dev) return 'dev';
      if (parent.port_test && childPort === parent.port_test) return 'test';
      if (parent.port_prod && childPort === parent.port_prod) return 'prod';
    }
  }

  // Fallback: detect from project name/slug
  const name = (project.name + ' ' + project.slug).toLowerCase();
  if (name.includes('prod') || name.includes('production') || name.includes('live')) return 'prod';
  if (name.includes('test') || name.includes('staging') || name.includes('qa')) return 'test';
  if (name.includes('dev') || name.includes('development') || name.includes('local')) return 'dev';
  return null;
}

// Wrapper component to handle Suspense for useSearchParams
export default function ProjectManagementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="animate-spin text-4xl">⚙️</div></div>}>
      <ProjectManagementContent />
    </Suspense>
  );
}

function ProjectManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get('project');
  const allClients = searchParams.get('allClients');
  const { selectedClient, setSelectedClient } = useClient();

  // Clear client filter when coming from Session Logs with allClients=true
  useEffect(() => {
    if (allClients === 'true' && selectedClient !== null) {
      setSelectedClient(null);
    }
  }, [allClients, selectedClient, setSelectedClient]);

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [previewDocs, setPreviewDocs] = useState<Array<{ id: string; name: string; doc_type: string }>>([]);
  const [previewTodos, setPreviewTodos] = useState<Array<{ id: string; title: string; status: string; priority: string }>>([]);
  const [previewKnowledge, setPreviewKnowledge] = useState<Array<{ id: string; title: string; category: string }>>([]);
  const [previewBugs, setPreviewBugs] = useState<Array<{ id: string; title: string; severity: string; status: string }>>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['todos', 'docs']));

  // Filter projects by selected client
  const projects = selectedClient
    ? allProjects.filter(p => p.client_id === selectedClient.id)
    : allProjects;

  // Stats type - matches summary API
  interface ProjectStats {
    todos: number;
    knowledge: number;
    docs: number;
    conventions: number;
    bugs: number;
  }

  // Get stats for a project (with parent aggregation)
  const getProjectStats = (projectId: string, isParent?: boolean): ProjectStats => {
    if (isParent) {
      // Aggregate children stats
      const childIds = childProjects.filter(p => p.parent_id === projectId).map(p => p.id);
      const aggregated: ProjectStats = { todos: 0, knowledge: 0, docs: 0, conventions: 0, bugs: 0 };

      // Include parent's own stats
      const parentStats = projectStats[projectId];
      if (parentStats) {
        aggregated.todos += parentStats.todos || 0;
        aggregated.knowledge += parentStats.knowledge || 0;
        aggregated.docs += parentStats.docs || 0;
        aggregated.conventions += parentStats.conventions || 0;
        aggregated.bugs += parentStats.bugs || 0;
      }

      // Add children stats
      for (const childId of childIds) {
        const childStat = projectStats[childId];
        if (childStat) {
          aggregated.todos += childStat.todos || 0;
          aggregated.knowledge += childStat.knowledge || 0;
          aggregated.docs += childStat.docs || 0;
          aggregated.conventions += childStat.conventions || 0;
          aggregated.bugs += childStat.bugs || 0;
        }
      }
      return aggregated;
    }
    return projectStats[projectId] || { todos: 0, knowledge: 0, docs: 0, conventions: 0, bugs: 0 };
  };

  // Stats display component - horizontal row with equal columns
  const StatsColumn = ({ stats }: { stats: ProjectStats }) => {
    const hasAny = stats.todos || stats.knowledge || stats.docs || stats.conventions || stats.bugs;
    if (!hasAny) return null;

    return (
      <div className="flex items-center gap-1">
        <div className="w-12 text-center px-1.5 py-0.5 bg-blue-600/20 rounded">
          <span className="text-xs font-medium text-blue-400">{stats.todos}</span>
        </div>
        <div className="w-12 text-center px-1.5 py-0.5 bg-purple-600/20 rounded">
          <span className="text-xs font-medium text-purple-400">{stats.knowledge}</span>
        </div>
        <div className="w-12 text-center px-1.5 py-0.5 bg-green-600/20 rounded">
          <span className="text-xs font-medium text-green-400">{stats.docs}</span>
        </div>
        <div className="w-12 text-center px-1.5 py-0.5 bg-yellow-600/20 rounded">
          <span className="text-xs font-medium text-yellow-400">{stats.conventions}</span>
        </div>
        <div className="w-12 text-center px-1.5 py-0.5 bg-red-600/20 rounded">
          <span className="text-xs font-medium text-red-400">{stats.bugs}</span>
        </div>
      </div>
    );
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group projects by parent
  const parentProjects = projects.filter(p => p.is_parent);
  const childProjects = projects.filter(p => !p.is_parent && p.parent_id);
  const orphanProjects = projects.filter(p => !p.is_parent && !p.parent_id);

  // Get children for a parent
  const getChildren = (parentId: string) => childProjects.filter(p => p.parent_id === parentId);

  // Toggle parent expansion
  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  // Fetch projects
  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle project selection from URL
  useEffect(() => {
    if (projectSlug && projects.length > 0) {
      const project = projects.find(p => p.slug === projectSlug);
      if (project) {
        setSelectedProject(project);
      }
    } else if (!projectSlug) {
      setSelectedProject(null);
    }
  }, [projectSlug, projects]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/project-management/api/projects');
      const data = await response.json();
      if (data.success) {
        setAllProjects(data.projects);
        // Fetch summaries for all projects
        fetchSummaries();
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummaries = async () => {
    try {
      const response = await fetch('/project-management/api/projects/summary');
      const data = await response.json();
      if (data.success && data.summaries) {
        setProjectStats(data.summaries);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    }
  };

  const fetchPreviewData = async (project: Project) => {
    setPreviewProject(project);
    const projectPath = project.server_path || '';

    // Fetch all data in parallel
    try {
      const [docsRes, todosRes, knowledgeRes, bugsRes] = await Promise.all([
        fetch(`/project-management/api/docs?project_path=${encodeURIComponent(projectPath)}`),
        fetch(`/project-management/api/todos?project_path=${encodeURIComponent(projectPath)}`),
        fetch(`/project-management/api/knowledge?project_path=${encodeURIComponent(projectPath)}`),
        fetch(`/project-management/api/bugs?project_path=${encodeURIComponent(projectPath)}`)
      ]);

      const [docsData, todosData, knowledgeData, bugsData] = await Promise.all([
        docsRes.json(), todosRes.json(), knowledgeRes.json(), bugsRes.json()
      ]);

      if (docsData.success && docsData.docs) {
        setPreviewDocs(docsData.docs.slice(0, 10));
      }
      if (todosData.success && todosData.todos) {
        const sorted = todosData.todos.sort((a: { status: string }, b: { status: string }) => {
          const order: Record<string, number> = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
          return (order[a.status] || 3) - (order[b.status] || 3);
        });
        setPreviewTodos(sorted.slice(0, 10));
      }
      if (knowledgeData.success && knowledgeData.knowledge) {
        setPreviewKnowledge(knowledgeData.knowledge.slice(0, 8));
      }
      if (bugsData.success && bugsData.bugs) {
        const activeBugs = bugsData.bugs.filter((b: { status: string }) => b.status !== 'resolved');
        setPreviewBugs(activeBugs.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching preview data:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleSelectProject = (project: Project) => {
    router.push(`/project-management?project=${project.slug}`);
  };

  const handleBackToList = () => {
    router.push('/project-management');
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setShowProjectForm(true);
  };

  const handleFormClose = () => {
    setShowProjectForm(false);
    setEditingProject(null);
  };

  const handleFormSave = () => {
    fetchProjects();
    handleFormClose();
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const activeProject = projects.find(p => p.id === active.id);
    const overProject = projects.find(p => p.id === over.id);

    if (!activeProject || !overProject) return;

    // Case 1: Reordering parents
    if (activeProject.is_parent && overProject.is_parent) {
      const oldIndex = parentProjects.findIndex(p => p.id === active.id);
      const newIndex = parentProjects.findIndex(p => p.id === over.id);

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(parentProjects, oldIndex, newIndex);
        // Update sort_order for all affected parents
        const updates = reordered.map((p, idx) =>
          fetch('/project-management/api/projects', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: p.id, sort_order: idx }),
          })
        );
        await Promise.all(updates);
        fetchProjects();
      }
      return;
    }

    // Case 2: Reordering children within same parent
    if (!activeProject.is_parent && !overProject.is_parent &&
        activeProject.parent_id === overProject.parent_id) {
      const siblings = childProjects.filter(p => p.parent_id === activeProject.parent_id);
      const oldIndex = siblings.findIndex(p => p.id === active.id);
      const newIndex = siblings.findIndex(p => p.id === over.id);

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(siblings, oldIndex, newIndex);
        const updates = reordered.map((p, idx) =>
          fetch('/project-management/api/projects', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: p.id, sort_order: idx }),
          })
        );
        await Promise.all(updates);
        fetchProjects();
      }
      return;
    }

    // Case 3: Moving child to different parent (drop on parent)
    if (!activeProject.is_parent && overProject.is_parent) {
      await fetch('/project-management/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeProject.id, parent_id: overProject.id }),
      });
      // Expand the target parent to show the moved child
      setExpandedParents(prev => new Set([...prev, overProject.id]));
      fetchProjects();
      return;
    }

    // Case 4: Moving child to different parent (drop on sibling in that parent)
    if (!activeProject.is_parent && !overProject.is_parent &&
        activeProject.parent_id !== overProject.parent_id && overProject.parent_id) {
      await fetch('/project-management/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeProject.id, parent_id: overProject.parent_id }),
      });
      setExpandedParents(prev => new Set([...prev, overProject.parent_id!]));
      fetchProjects();
      return;
    }

    // Case 5: Reordering orphan projects
    if (!activeProject.is_parent && !activeProject.parent_id &&
        !overProject.is_parent && !overProject.parent_id) {
      const oldIndex = orphanProjects.findIndex(p => p.id === active.id);
      const newIndex = orphanProjects.findIndex(p => p.id === over.id);

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(orphanProjects, oldIndex, newIndex);
        const updates = reordered.map((p, idx) =>
          fetch('/project-management/api/projects', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: p.id, sort_order: idx + 1000 }), // Offset to avoid conflicts
          })
        );
        await Promise.all(updates);
        fetchProjects();
      }
    }
  };

  // Get the active dragging project for overlay
  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

  const renderTabContent = () => {
    if (!selectedProject) return null;

    const projectPath = selectedProject.server_path || '';
    const isParent = selectedProject.is_parent || false;
    // Get child project IDs if this is a parent
    const childProjectIds = isParent
      ? projects.filter(p => p.parent_id === selectedProject.id).map(p => p.id)
      : [];

    switch (activeTab) {
      case 'todos':
        return <TodosTab projectPath={projectPath} projectId={selectedProject.id} projectName={selectedProject.name} isParent={isParent} childProjectIds={childProjectIds} />;
      case 'knowledge':
        return <KnowledgeTab projectPath={projectPath} projectId={selectedProject.id} projectName={selectedProject.name} isParent={isParent} childProjectIds={childProjectIds} />;
      case 'docs':
        return <DocsTab projectPath={projectPath} projectId={selectedProject.id} projectName={selectedProject.name} isParent={isParent} childProjectIds={childProjectIds} />;
      case 'database':
        return <DatabaseTab projectPath={projectPath} projectId={selectedProject.id} projectName={selectedProject.name} isParent={isParent} childProjectIds={childProjectIds} />;
      case 'structure':
        return <StructureTab projectPath={projectPath} projectId={selectedProject.id} projectName={selectedProject.name} isParent={isParent} childProjectIds={childProjectIds} />;
      case 'conventions':
        return <ConventionsTab projectPath={projectPath} projectId={selectedProject.id} projectName={selectedProject.name} isParent={isParent} childProjectIds={childProjectIds} />;
      case 'notepad':
        return <NotepadTab projectPath={projectPath} projectId={selectedProject.id} projectName={selectedProject.name} isParent={isParent} childProjectIds={childProjectIds} />;
      case 'bugs':
        return <BugsTab projectPath={projectPath} projectId={selectedProject.id} projectName={selectedProject.name} isParent={isParent} childProjectIds={childProjectIds} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Detail View - when a project is selected
  if (selectedProject) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Projects</span>
          </button>
          <ProjectHeader
            project={selectedProject}
            onEdit={() => handleEditProject(selectedProject)}
          />
        </div>

        {/* Tabs */}
        <ProjectTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderTabContent()}
        </div>

        {/* Project Form Modal */}
        {showProjectForm && (
          <ProjectForm
            project={editingProject}
            onClose={handleFormClose}
            onSave={handleFormSave}
          />
        )}
      </div>
    );
  }

  // Sortable Parent Row Component
  const SortableParentRow = ({ project }: { project: Project }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: project.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const children = getChildren(project.id);
    const isExpanded = expandedParents.has(project.id);
    const hasChildren = children.length > 0;

    // Aggregate child info - use parent port slots to determine environment
    const devChildren = children.filter(c => detectEnvironment(c, project) === 'dev');
    const testChildren = children.filter(c => detectEnvironment(c, project) === 'test');
    const prodChildren = children.filter(c => detectEnvironment(c, project) === 'prod');

    // Get all ports from children
    const childDevPorts = children.filter(c => c.port_dev).map(c => c.port_dev);
    const childTestPorts = children.filter(c => c.port_test).map(c => c.port_test);
    const childProdPorts = children.filter(c => c.port_prod).map(c => c.port_prod);

    return (
      <div ref={setNodeRef} style={style} className="mb-2">
        {/* Parent Row */}
        <div
          className={`bg-gray-800 border rounded-lg p-4 transition-colors group ${
            overId === project.id && activeId && !projects.find(p => p.id === activeId)?.is_parent
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-blue-500'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="p-1 text-gray-600 hover:text-white cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            {/* Expand Arrow */}
            <button
              onClick={() => hasChildren && toggleParent(project.id)}
              className={`p-1 rounded transition-colors ${hasChildren ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'text-gray-700 cursor-default'}`}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>

            {/* Logo/Avatar */}
            {project.logo_url ? (
              <img src={project.logo_url} alt={project.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 text-lg font-bold">
                {project.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name & Info */}
            <div
              className="flex-1 cursor-pointer"
              onClick={() => fetchPreviewData(project)}
              onDoubleClick={() => handleSelectProject(project)}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold">{project.name}</h3>
                <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded text-xs">Parent</span>
              </div>
              {/* Child environment summary */}
              {hasChildren && (
                <div className="flex items-center gap-2 mt-1">
                  {devChildren.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded text-[10px]">
                      {devChildren.length} Dev
                    </span>
                  )}
                  {testChildren.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-yellow-600/20 text-yellow-400 rounded text-[10px]">
                      {testChildren.length} Test
                    </span>
                  )}
                  {prodChildren.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-green-600/20 text-green-400 rounded text-[10px]">
                      {prodChildren.length} Prod
                    </span>
                  )}
                  {children.length > 0 && devChildren.length === 0 && testChildren.length === 0 && prodChildren.length === 0 && (
                    <span className="text-gray-500 text-[10px]">{children.length} projects</span>
                  )}
                </div>
              )}
            </div>

            {/* Stats Column */}
            <StatsColumn stats={getProjectStats(project.id, true)} />

            {/* Dev/Test/Prod ports - one of each */}
            <div className="flex items-center gap-2">
              {(childDevPorts[0] || project.port_dev) && (
                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs">
                  :{childDevPorts[0] || project.port_dev}
                </span>
              )}
              {(childTestPorts[0] || project.port_test) && (
                <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded text-xs">
                  :{childTestPorts[0] || project.port_test}
                </span>
              )}
              {(childProdPorts[0] || project.port_prod) && (
                <span className="px-2 py-0.5 bg-green-600/20 text-green-400 rounded text-xs">
                  :{childProdPorts[0] || project.port_prod}
                </span>
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
              className="p-2 text-gray-500 hover:text-white hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Children (when expanded) */}
        {isExpanded && children.length > 0 && (
          <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-700 pl-4">
            <SortableContext items={children.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {children.map(child => (
                <SortableChildRow key={child.id} child={child} parent={project} />
              ))}
            </SortableContext>
          </div>
        )}
      </div>
    );
  };

  // Sortable Child Row Component
  const SortableChildRow = ({ child, parent }: { child: Project; parent: Project }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: child.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    // Use parent's port configuration to determine child environment
    const env = detectEnvironment(child, parent);
    const envColor = env ? ENV_COLORS[env] : null;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group
          ${envColor ? `${envColor.bg} border ${envColor.border}` : 'bg-gray-800 border border-gray-700'}
          hover:brightness-110`}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-500 hover:text-white cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3" />
        </button>

        {/* Environment Badge */}
        {envColor && (
          <span className={`px-2 py-1 rounded text-xs font-medium ${envColor.text} ${envColor.bg}`}>
            {envColor.label}
          </span>
        )}

        {/* Name */}
        <span
          className={`font-medium flex-1 cursor-pointer ${envColor ? envColor.text : 'text-white'}`}
          onClick={() => fetchPreviewData(child)}
          onDoubleClick={() => handleSelectProject(child)}
        >
          {child.name}
        </span>

        {/* Stats Column */}
        <StatsColumn stats={getProjectStats(child.id)} />

        {/* Port */}
        {(child.port_dev || child.port_test || child.port_prod) && (
          <span className="text-gray-500 text-xs">
            :{child.port_dev || child.port_test || child.port_prod}
          </span>
        )}

        {/* Edit */}
        <button
          onClick={(e) => { e.stopPropagation(); handleEditProject(child); }}
          className="p-1 text-gray-500 hover:text-white hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-all"
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // Sortable Orphan Row Component
  const SortableOrphanRow = ({ project }: { project: Project }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: project.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const env = detectEnvironment(project);
    const envColor = env ? ENV_COLORS[env] : null;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer group mb-2"
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-gray-600 hover:text-white cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Logo */}
          {project.logo_url ? (
            <img src={project.logo_url} alt={project.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold
              ${envColor ? `${envColor.bg} ${envColor.text}` : 'bg-blue-600/20 text-blue-400'}`}>
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name */}
          <div className="flex-1 cursor-pointer" onClick={() => fetchPreviewData(project)} onDoubleClick={() => handleSelectProject(project)}>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold">{project.name}</h3>
              {envColor && (
                <span className={`px-2 py-0.5 rounded text-xs ${envColor.bg} ${envColor.text}`}>
                  {envColor.label}
                </span>
              )}
            </div>
            <span className="text-gray-500 text-xs">{project.slug}</span>
          </div>

          {/* Stats Column */}
          <StatsColumn stats={getProjectStats(project.id)} />

          {/* Ports */}
          <div className="flex items-center gap-2">
            {project.port_dev && (
              <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs">Dev:{project.port_dev}</span>
            )}
            {project.port_test && (
              <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded text-xs">Test:{project.port_test}</span>
            )}
            {project.port_prod && (
              <span className="px-2 py-0.5 bg-green-600/20 text-green-400 rounded text-xs">Prod:{project.port_prod}</span>
            )}
          </div>

          {/* Edit */}
          <button
            onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // List View - all projects
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Project Management</h1>
              {selectedClient && (
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {selectedClient.name}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1">
              {parentProjects.length} parent{parentProjects.length !== 1 ? 's' : ''} · {childProjects.length + orphanProjects.length} project{(childProjects.length + orphanProjects.length) !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleAddProject}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        </div>

        {/* Stats Row - totals across all projects (filtered by client) */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-5 gap-3">
            {(() => {
              // Aggregate stats across all visible projects
              const totalStats = { todos: 0, knowledge: 0, docs: 0, conventions: 0, bugs: 0 };
              projects.forEach(p => {
                const s = projectStats[p.id];
                if (s) {
                  totalStats.todos += s.todos || 0;
                  totalStats.knowledge += s.knowledge || 0;
                  totalStats.docs += s.docs || 0;
                  totalStats.conventions += s.conventions || 0;
                  totalStats.bugs += s.bugs || 0;
                }
              });
              return (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <span className="text-sm text-gray-400">Todos</span>
                    <span className="text-xl font-bold text-blue-400">{totalStats.todos}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <span className="text-sm text-gray-400">Knowledge</span>
                    <span className="text-xl font-bold text-purple-400">{totalStats.knowledge}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <span className="text-sm text-gray-400">Docs</span>
                    <span className="text-xl font-bold text-green-400">{totalStats.docs}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <span className="text-sm text-gray-400">Conventions</span>
                    <span className="text-xl font-bold text-yellow-400">{totalStats.conventions}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <span className="text-sm text-gray-400">Bugs</span>
                    <span className="text-xl font-bold text-red-400">{totalStats.bugs}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Project List + Preview Panel */}
      <div className="flex gap-6 p-6">
        {/* Left: Project List (2/3) */}
        <div className="flex-1 max-w-3xl">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
            <p className="text-gray-400 mb-4">Create your first project to get started</p>
            <button
              onClick={handleAddProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Add Project
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div>
              {/* Parent Projects with Children */}
              <SortableContext items={parentProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {parentProjects.map(parent => (
                  <SortableParentRow key={parent.id} project={parent} />
                ))}
              </SortableContext>

              {/* Orphan Projects (no parent) */}
              {orphanProjects.length > 0 && parentProjects.length > 0 && (
                <div className="mt-6 mb-3">
                  <h3 className="text-gray-500 text-sm font-medium px-2">Standalone Projects</h3>
                </div>
              )}
              <SortableContext items={orphanProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {orphanProjects.map(project => (
                  <SortableOrphanRow key={project.id} project={project} />
                ))}
              </SortableContext>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeProject && (
                <div className="bg-gray-800 border border-blue-500 rounded-lg p-4 shadow-xl opacity-90">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-medium">{activeProject.name}</span>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
        </div>

        {/* Right: Preview Panel (1/3) */}
        <div className="w-96 flex-shrink-0">
          {previewProject ? (
            <div className="bg-gray-800 border border-gray-700 rounded-lg sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto">
              {/* Project Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-gray-800 sticky top-0">
                {previewProject.logo_url ? (
                  <img src={previewProject.logo_url} alt={previewProject.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 text-xl font-bold">
                    {previewProject.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{previewProject.name}</h3>
                  <div className="flex items-center gap-2">
                    {previewProject.is_parent && (
                      <span className="text-xs text-purple-400">Parent</span>
                    )}
                    {previewProject.description && (
                      <span className="text-xs text-gray-500 truncate max-w-[180px]">{previewProject.description}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Project KPI Stats */}
              <div className="p-4 border-b border-gray-700">
                <div className="grid grid-cols-5 gap-2">
                  {(() => {
                    const stats = getProjectStats(previewProject.id, previewProject.is_parent);
                    return (
                      <>
                        <div className="text-center p-2 bg-gray-900 rounded">
                          <div className="text-lg font-bold text-blue-400">{stats.todos}</div>
                          <div className="text-[10px] text-gray-500">Todos</div>
                        </div>
                        <div className="text-center p-2 bg-gray-900 rounded">
                          <div className="text-lg font-bold text-purple-400">{stats.knowledge}</div>
                          <div className="text-[10px] text-gray-500">Know</div>
                        </div>
                        <div className="text-center p-2 bg-gray-900 rounded">
                          <div className="text-lg font-bold text-green-400">{stats.docs}</div>
                          <div className="text-[10px] text-gray-500">Docs</div>
                        </div>
                        <div className="text-center p-2 bg-gray-900 rounded">
                          <div className="text-lg font-bold text-yellow-400">{stats.conventions}</div>
                          <div className="text-[10px] text-gray-500">Conv</div>
                        </div>
                        <div className="text-center p-2 bg-gray-900 rounded">
                          <div className="text-lg font-bold text-red-400">{stats.bugs}</div>
                          <div className="text-[10px] text-gray-500">Bugs</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Collapsible Sections */}
              <div className="divide-y divide-gray-700">
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
                  onClick={() => handleSelectProject(previewProject)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Open Project →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700/50 border-dashed rounded-lg p-8 text-center">
              <div className="text-gray-600 text-sm mb-2">Select a project</div>
              <div className="text-gray-500 text-xs">Click any project to see KPIs and details</div>
            </div>
          )}
        </div>
      </div>

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
}
