'use client';

import { useState, useEffect } from 'react';
import { Database, Table, Plus, Edit2, Trash2, X, Save, Clock, Search, RefreshCw, Copy, Check } from 'lucide-react';

interface DatabaseItem {
  id: string;
  project_id: string;
  convention_type: string;
  name: string;
  description: string;
  bucket: string;
  keywords: string[];
  status: string;
  created_at: string;
}

interface DatabaseTabProps {
  projectPath: string;
  projectId: string;
  projectName?: string;
  isParent?: boolean;
  childProjectIds?: string[];
}

const formatDate = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function DatabaseTab({ projectId, projectName, isParent, childProjectIds }: DatabaseTabProps) {
  const [items, setItems] = useState<DatabaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Fetch database patterns from dev_ai_conventions
  useEffect(() => {
    fetchDatabasePatterns();
  }, [projectId, isParent, childProjectIds]);

  const fetchDatabasePatterns = async () => {
    setIsLoading(true);
    try {
      // If parent, fetch for all child projects + parent
      const projectIdsToFetch = isParent && childProjectIds?.length
        ? [projectId, ...childProjectIds]
        : [projectId];

      const allItems: DatabaseItem[] = [];

      for (const pid of projectIdsToFetch) {
        const res = await fetch(`/project-management/api/conventions?project_id=${pid}&convention_type=database`);
        const data = await res.json();
        if (data.success && data.conventions) {
          allItems.push(...data.conventions);
        }
      }

      // Sort by created_at descending
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(allItems);
    } catch (error) {
      console.error('Error fetching database patterns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      const url = editingId
        ? `/project-management/api/conventions/${editingId}`
        : '/project-management/api/conventions';

      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          convention_type: 'database',
          name: formData.name,
          description: formData.description,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchDatabasePatterns();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving database pattern:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this database pattern?')) return;

    try {
      const res = await fetch(`/project-management/api/conventions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDatabasePatterns();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const startEdit = (item: DatabaseItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description || '',
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  const copyToClipboard = async (item: DatabaseItem) => {
    await navigator.clipboard.writeText(item.description || item.name);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
  });

  // Extract table name from name field (e.g., "Schema: dev_projects" -> "dev_projects")
  const getTableName = (name: string) => {
    const match = name.match(/(?:Schema|Table):\s*(\w+)/i);
    return match ? match[1] : name;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Database Patterns
          </h2>
          <p className="text-sm text-gray-400">
            {items.length} schemas discovered by Jen from transcripts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDatabasePatterns}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add Schema
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">
              {editingId ? 'Edit Schema' : 'Add Schema'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Table/Schema Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Schema: dev_users"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">SQL / Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="CREATE TABLE dev_users (..."
                rows={6}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm font-mono"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={resetForm} className="px-4 py-2 text-gray-400 hover:text-white text-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schema List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No database patterns discovered yet.</p>
          <p className="text-sm mt-1">Jen will extract CREATE TABLE and ALTER TABLE statements from your coding sessions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              {/* Table Header */}
              <div
                className="px-4 py-3 flex items-center gap-3 hover:bg-gray-750 cursor-pointer"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <Table className="w-4 h-4 text-blue-400" />
                <span className="text-white font-mono text-sm flex-1">{getTableName(item.name)}</span>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Clock className="w-3 h-3" />
                  {formatDate(item.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(item); }}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                    title="Copy SQL"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Expanded SQL Content */}
              {expandedId === item.id && item.description && (
                <div className="px-4 py-3 border-t border-gray-700 bg-gray-900">
                  <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                    {item.description}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
