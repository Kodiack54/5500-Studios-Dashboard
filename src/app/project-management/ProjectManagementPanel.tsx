'use client';

import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Server, ChevronRight, Settings, GripVertical, CheckSquare, BookOpen, Clock, AlertCircle, Building2 } from 'lucide-react';
import { Project, TabType, TABS } from './types';
import { useClient } from '@/app/contexts/ClientContext';
import ProjectHeader from './components/ProjectHeader';
import ProjectTabs from './components/ProjectTabs';
import ProjectForm from './components/ProjectForm';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
import NotepadTab from './tabs/NotepadTab';
import BugsTab from './tabs/BugsTab';
import ConventionsTab from './tabs/ConventionsTab';
import KnowledgeTab from './tabs/KnowledgeTab';

interface ProjectSummary {
  sessions: { pending: number; processed: number; total: number };
  todos: { pending: number; completed: number; total: number };
  knowledge: number;
  bugs: number;
  code_changes: number;
  last_activity: string | null;
}

interface ProjectManagementPanelProps {
  onProjectsChange?: () => void;
}

// Sortable Project Card Component
function SortableProjectCard({
  project,
  summary,
  formatTimeAgo,
  onSelect,
  onEdit,
}: {
  project: Project;
  summary?: ProjectSummary;
  formatTimeAgo: (date: string | null) => string | null;
  onSelect: (p: Project) => void;
  onEdit: (p: Project) => void;
}) {
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
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500 rounded cursor-pointer group transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-600 hover:text-white cursor-grab active:cursor-grabbing flex-shrink-0 mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Logo/Initial */}
        <div onClick={() => onSelect(project)} className="flex-shrink-0">
          {project.logo_url ? (
            <img src={project.logo_url} alt="" className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 rounded bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0" onClick={() => onSelect(project)}>
          {/* Name & Description */}
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{project.name}</span>
            <span className="text-gray-600 text-xs">({project.slug})</span>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 ml-auto flex-shrink-0" />
          </div>
          {project.description && (
            <p className="text-gray-400 text-sm mt-0.5 truncate">{project.description}</p>
          )}

          {/* At-a-glance Info Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
            {/* Droplet */}
            {project.droplet_name && (
              <span className="flex items-center gap-1 text-gray-400">
                <Server className="w-3 h-3" />
                {project.droplet_name}
                {project.droplet_ip && <span className="text-gray-600">({project.droplet_ip})</span>}
              </span>
            )}

            {/* Ports */}
            {(project.port_dev || project.port_test || project.port_prod) && (
              <span className="flex items-center gap-1">
                {project.port_dev && <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded">Dev:{project.port_dev}</span>}
                {project.port_test && <span className="px-1.5 py-0.5 bg-yellow-600/20 text-yellow-400 rounded">Test:{project.port_test}</span>}
                {project.port_prod && <span className="px-1.5 py-0.5 bg-green-600/20 text-green-400 rounded">Prod:{project.port_prod}</span>}
              </span>
            )}

            {/* Build Number */}
            {project.build_number && (
              <span className="text-gray-500">
                Build: <span className="text-gray-300">{project.build_number}</span>
              </span>
            )}

            {/* Git Repo */}
            {project.git_repo && (
              <span className="text-gray-500 truncate max-w-[200px]">
                {project.git_repo.replace('https://github.com/', '')}
              </span>
            )}
          </div>

          {/* At-a-glance Stats Row */}
          {summary && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 pt-2 border-t border-gray-700/50 text-xs">
              {/* Todos */}
              {summary.todos.total > 0 && (
                <span className="flex items-center gap-1 text-gray-400">
                  <CheckSquare className="w-3 h-3" />
                  <span className="text-yellow-400">{summary.todos.pending}</span>
                  <span className="text-gray-600">/</span>
                  <span className="text-green-400">{summary.todos.completed}</span>
                  <span className="text-gray-600">todos</span>
                </span>
              )}

              {/* Knowledge */}
              {summary.knowledge > 0 && (
                <span className="flex items-center gap-1 text-gray-400">
                  <BookOpen className="w-3 h-3" />
                  <span className="text-purple-400">{summary.knowledge}</span>
                  <span className="text-gray-600">knowledge</span>
                </span>
              )}

              {/* Bugs */}
              {summary.bugs > 0 && (
                <span className="flex items-center gap-1 text-gray-400">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-red-400">{summary.bugs}</span>
                  <span className="text-gray-600">bugs</span>
                </span>
              )}

              {/* Pending Sessions */}
              {summary.sessions.pending > 0 && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-600/10 text-yellow-400 rounded">
                  {summary.sessions.pending} pending
                </span>
              )}

              {/* Last Activity */}
              {summary.last_activity && (
                <span className="flex items-center gap-1 text-gray-500 ml-auto">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(summary.last_activity)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Edit button */}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(project); }}
          className="p-2 text-gray-500 hover:text-white hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ProjectManagementPanel({ onProjectsChange }: ProjectManagementPanelProps) {
  const { selectedClient } = useClient();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectSummaries, setProjectSummaries] = useState<Record<string, ProjectSummary>>({});

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter projects by selected client
  const projects = selectedClient
    ? allProjects.filter(p => p.client_id === selectedClient.id)
    : allProjects;

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      fetchProjectSummaries();
    }
  }, [projects]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/project-management/api/projects');
      const data = await response.json();
      if (data.success) {
        setAllProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectSummaries = async () => {
    try {
      const response = await fetch('/project-management/api/projects/summary');
      const data = await response.json();
      if (data.success && data.summaries) {
        setProjectSummaries(data.summaries);
      }
    } catch (error) {
      console.error('Error fetching project summaries:', error);
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setActiveTab('todos');
  };

  const handleBackToList = () => {
    setSelectedProject(null);
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
    onProjectsChange?.();
    handleFormClose();
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex(p => p.id === active.id);
    const newIndex = projects.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update the UI
    const reorderedProjects = arrayMove(projects, oldIndex, newIndex);

    // Update allProjects with new order
    const newAllProjects = [...allProjects];
    reorderedProjects.forEach((project, index) => {
      const allIndex = newAllProjects.findIndex(p => p.id === project.id);
      if (allIndex !== -1) {
        newAllProjects[allIndex] = { ...newAllProjects[allIndex], sort_order: index };
      }
    });
    setAllProjects(newAllProjects);

    // Save to database
    try {
      await Promise.all(
        reorderedProjects.map((project, index) =>
          fetch('/project-management/api/projects', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: project.id, sort_order: index }),
          })
        )
      );
      onProjectsChange?.();
    } catch (error) {
      console.error('Error saving project order:', error);
      fetchProjects(); // Revert on error
    }
  };

  const renderTabContent = () => {
    if (!selectedProject) return null;
    const projectPath = selectedProject.server_path || '';

    // Determine if this is a parent project and get child IDs
    const isParent = selectedProject.is_parent === true;
    const childProjectIds = isParent
      ? allProjects.filter(p => p.parent_id === selectedProject.id).map(p => p.id)
      : [];

    switch (activeTab) {
      case 'todos':
        return <TodosTab projectPath={projectPath} projectId={selectedProject.id} isParent={isParent} childProjectIds={childProjectIds} />;
      case 'knowledge':
        return <KnowledgeTab projectPath={projectPath} projectId={selectedProject.id} isParent={isParent} childProjectIds={childProjectIds} />;
      case 'docs':
        return <DocsTab projectPath={projectPath} projectId={selectedProject.id} isParent={isParent} childProjectIds={childProjectIds} />;
      case 'database':
        return <DatabaseTab projectPath={projectPath} projectId={selectedProject.id} />;
      case 'structure':
        return <StructureTab projectPath={projectPath} projectId={selectedProject.id} isParent={isParent} childProjectIds={childProjectIds} />;

      case 'conventions':
        return <ConventionsTab projectPath={projectPath} projectId={selectedProject.id} isParent={isParent} childProjectIds={childProjectIds} />;
      case 'notepad':
        return <NotepadTab projectPath={projectPath} projectId={selectedProject.id} />;
      case 'bugs':
        return <BugsTab projectPath={projectPath} projectId={selectedProject.id} projectName={selectedProject.name} isParent={isParent} childProjectIds={childProjectIds} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin text-2xl">⚙️</div>
      </div>
    );
  }

  // Detail View - when a project is selected
  if (selectedProject) {
    return (
      <div className="flex flex-col h-full">
        {/* Back button */}
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          All Projects
        </button>

        {/* Project Header */}
        <div className="mb-3 pb-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">{selectedProject.name}</h2>
              {selectedProject.description && (
                <p className="text-gray-400 text-sm">{selectedProject.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                {selectedProject.droplet_name && (
                  <span className="flex items-center gap-1">
                    <Server className="w-3 h-3" />
                    {selectedProject.droplet_name}
                  </span>
                )}
                {selectedProject.port_dev && (
                  <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded">
                    Dev: {selectedProject.port_dev}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleEditProject(selectedProject)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="flex-1 overflow-auto mt-3">
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

  // List View - all projects
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">{projects.length} projects</span>
          {selectedClient && (
            <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {selectedClient.name}
            </span>
          )}
        </div>
        <button
          onClick={handleAddProject}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      {/* Project List */}
      {projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📁</div>
          <p>No projects yet</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="flex-1 overflow-auto space-y-2">
              {projects.map((project) => (
                <SortableProjectCard
                  key={project.id}
                  project={project}
                  summary={projectSummaries[project.id]}
                  formatTimeAgo={formatTimeAgo}
                  onSelect={handleSelectProject}
                  onEdit={handleEditProject}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

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
