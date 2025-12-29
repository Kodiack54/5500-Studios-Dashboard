'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Circle, Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Edit2, X, Check } from 'lucide-react';
import { Phase, PhaseItem } from '../types';

interface PhasesTabProps {
  projectPath: string;
  projectId: string;
  projectName?: string;
  isParent?: boolean;
  childProjectIds?: string[];
}

interface PhaseWithItems extends Phase {
  items: PhaseItem[];
}

export default function PhasesTab({ projectId, projectName }: PhasesTabProps) {
  const [phases, setPhases] = useState<PhaseWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [addingToPhase, setAddingToPhase] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch phases
      const phasesRes = await fetch(`/project-management/api/phases/${projectId}`);
      const phasesData = await phasesRes.json();

      if (phasesData.success && phasesData.phases) {
        // Fetch items for each phase
        const phasesWithItems = await Promise.all(
          phasesData.phases.map(async (phase: Phase) => {
            const itemsRes = await fetch(`/project-management/api/phase-items?phase_id=${phase.id}`);
            const itemsData = await itemsRes.json();
            return {
              ...phase,
              items: itemsData.success ? itemsData.items : [],
            };
          })
        );

        setPhases(phasesWithItems);

        // Auto-expand current (in_progress) phase
        const currentPhase = phasesWithItems.find((p: PhaseWithItems) => p.status === 'in_progress');
        if (currentPhase) {
          setExpandedPhases(new Set([currentPhase.id]));
        }
      }
    } catch (err) {
      console.error('Error fetching phases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const handleToggleItem = async (item: PhaseItem) => {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      await fetch(`/project-management/api/phase-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  const handleAddItem = async (phaseId: string) => {
    if (!newItemTitle.trim()) return;

    try {
      const phase = phases.find(p => p.id === phaseId);
      const sortOrder = phase ? phase.items.length : 0;

      await fetch('/project-management/api/phase-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase_id: phaseId,
          title: newItemTitle.trim(),
          sort_order: sortOrder,
        }),
      });

      setNewItemTitle('');
      setAddingToPhase(null);
      fetchData();
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    if (!editTitle.trim()) return;

    try {
      await fetch(`/project-management/api/phase-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      setEditingItem(null);
      setEditTitle('');
      fetchData();
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await fetch(`/project-management/api/phase-items/${itemId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const startEditing = (item: PhaseItem) => {
    setEditingItem(item.id);
    setEditTitle(item.title);
  };

  const getPhaseProgress = (phase: PhaseWithItems) => {
    if (phase.items.length === 0) return 0;
    const completed = phase.items.filter(i => i.status === 'completed').length;
    return Math.round((completed / phase.items.length) * 100);
  };

  const getPhaseStatusColor = (phase: PhaseWithItems) => {
    const progress = getPhaseProgress(phase);
    if (progress === 100) return 'bg-green-600/20 border-green-500 text-green-400';
    if (phase.status === 'in_progress') return 'bg-blue-600/20 border-blue-500 text-blue-400';
    return 'bg-gray-800 border-gray-700 text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (phases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">No phases defined for this project</div>
        <p className="text-gray-600 text-sm">Phases are defined in the dev_project_phases table</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{projectName || 'Project'} Phases</h2>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Overall Progress */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300">Overall Progress</span>
          <span className="text-gray-400 text-sm">
            {phases.reduce((acc, p) => acc + p.items.filter(i => i.status === 'completed').length, 0)}/
            {phases.reduce((acc, p) => acc + p.items.length, 0)} items
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{
              width: `${phases.reduce((acc, p) => acc + p.items.length, 0) > 0
                ? Math.round((phases.reduce((acc, p) => acc + p.items.filter(i => i.status === 'completed').length, 0) /
                    phases.reduce((acc, p) => acc + p.items.length, 0)) * 100)
                : 0}%`
            }}
          />
        </div>
      </div>

      {/* Phases List */}
      <div className="space-y-3">
        {phases.map(phase => {
          const isExpanded = expandedPhases.has(phase.id);
          const progress = getPhaseProgress(phase);
          const completedCount = phase.items.filter(i => i.status === 'completed').length;
          const isAdding = addingToPhase === phase.id;

          return (
            <div key={phase.id} className={`border rounded-lg overflow-hidden ${getPhaseStatusColor(phase)}`}>
              {/* Phase Header */}
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                )}

                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">Phase {phase.phase_num}: {phase.name}</span>
                    {progress === 100 && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    {phase.status === 'in_progress' && progress < 100 && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">Current</span>
                    )}
                  </div>
                  {phase.description && (
                    <p className="text-gray-500 text-sm mt-0.5">{phase.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Progress */}
                  <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-16 text-right">
                    {completedCount}/{phase.items.length}
                  </span>
                </div>
              </button>

              {/* Phase Items */}
              {isExpanded && (
                <div className="border-t border-gray-700 bg-gray-900/50">
                  <div className="p-4 space-y-2">
                    {phase.items.map(item => {
                      const isCompleted = item.status === 'completed';
                      const isEditingThis = editingItem === item.id;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 group"
                        >
                          <GripVertical className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab" />

                          <button
                            onClick={() => handleToggleItem(item)}
                            className="flex-shrink-0"
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-500 hover:text-blue-400" />
                            )}
                          </button>

                          {isEditingThis ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleUpdateItem(item.id)}
                                className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateItem(item.id)}
                                className="p-1 text-green-400 hover:bg-green-400/20 rounded"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="p-1 text-gray-400 hover:bg-gray-700 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className={`flex-1 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                {item.title}
                              </span>

                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                <button
                                  onClick={() => startEditing(item)}
                                  className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Item */}
                    {isAdding ? (
                      <div className="flex items-center gap-2 p-2">
                        <Circle className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <input
                          type="text"
                          value={newItemTitle}
                          onChange={e => setNewItemTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddItem(phase.id);
                            if (e.key === 'Escape') {
                              setAddingToPhase(null);
                              setNewItemTitle('');
                            }
                          }}
                          placeholder="Enter item title..."
                          className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddItem(phase.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAddingToPhase(null);
                            setNewItemTitle('');
                          }}
                          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingToPhase(phase.id)}
                        className="flex items-center gap-2 p-2 text-gray-500 hover:text-blue-400 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add item
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
