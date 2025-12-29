'use client';

import { useState, useCallback } from 'react';
import {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Project } from '../types';

interface UseProjectDragDropProps {
  projects: Project[];
  parentProjects: Project[];
  childProjects: Project[];
  orphanProjects: Project[];
  onRefresh: () => void;
  setExpandedParents: React.Dispatch<React.SetStateAction<Set<string>>>;
}

interface UseProjectDragDropReturn {
  activeId: string | null;
  overId: string | null;
  activeProject: Project | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
}

/**
 * Hook to handle all drag and drop logic for project management
 */
export function useProjectDragDrop({
  projects,
  parentProjects,
  childProjects,
  orphanProjects,
  onRefresh,
  setExpandedParents,
}: UseProjectDragDropProps): UseProjectDragDropReturn {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const activeProject = activeId ? projects.find(p => p.id === activeId) || null : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const activeProj = projects.find(p => p.id === active.id);
    const overProj = projects.find(p => p.id === over.id);

    if (!activeProj || !overProj) return;

    // Case 1: Reordering parents
    if (activeProj.is_parent && overProj.is_parent) {
      const oldIndex = parentProjects.findIndex(p => p.id === active.id);
      const newIndex = parentProjects.findIndex(p => p.id === over.id);

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(parentProjects, oldIndex, newIndex);
        const updates = reordered.map((p, idx) =>
          fetch('/project-management/api/projects', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: p.id, sort_order: idx }),
          })
        );
        await Promise.all(updates);
        onRefresh();
      }
      return;
    }

    // Case 2: Reordering children within same parent
    if (!activeProj.is_parent && !overProj.is_parent &&
        activeProj.parent_id === overProj.parent_id) {
      const siblings = childProjects.filter(p => p.parent_id === activeProj.parent_id);
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
        onRefresh();
      }
      return;
    }

    // Case 3: Moving child to different parent (drop on parent)
    if (!activeProj.is_parent && overProj.is_parent) {
      await fetch('/project-management/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeProj.id, parent_id: overProj.id }),
      });
      // Expand the target parent to show the moved child
      setExpandedParents(prev => new Set([...prev, overProj.id]));
      onRefresh();
      return;
    }

    // Case 4: Moving child to different parent (drop on sibling in that parent)
    if (!activeProj.is_parent && !overProj.is_parent &&
        activeProj.parent_id !== overProj.parent_id && overProj.parent_id) {
      await fetch('/project-management/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeProj.id, parent_id: overProj.parent_id }),
      });
      setExpandedParents(prev => new Set([...prev, overProj.parent_id!]));
      onRefresh();
      return;
    }

    // Case 5: Reordering orphan projects
    if (!activeProj.is_parent && !activeProj.parent_id &&
        !overProj.is_parent && !overProj.parent_id) {
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
        onRefresh();
      }
    }
  }, [projects, parentProjects, childProjects, orphanProjects, onRefresh, setExpandedParents]);

  return {
    activeId,
    overId,
    activeProject,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
