'use client';

import { useState, useEffect } from 'react';
import { FolderTree, File, Plus, Edit2, Trash2, X, Save, Clock, Search, RefreshCw } from 'lucide-react';

interface StructureItem {
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

interface StructureTabProps {
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

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const colors: Record<string, string> = {
    'tsx': 'text-blue-400',
    'ts': 'text-blue-300',
    'js': 'text-yellow-400',
    'jsx': 'text-yellow-300',
    'css': 'text-pink-400',
    'json': 'text-green-400',
    'md': 'text-gray-400',
    'sql': 'text-orange-400',
    'sh': 'text-green-300',
    'py': 'text-yellow-500',
    'html': 'text-orange-400',
  };
  return <File className={`w-4 h-4 ${colors[ext] || 'text-gray-500'}`} />;
};

export default function StructureTab({ projectId, projectName, isParent, childProjectIds }: StructureTabProps) {
  const [items, setItems] = useState<StructureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Fetch structure items from dev_ai_conventions
  useEffect(() => {
    fetchStructure();
  }, [projectId, isParent, childProjectIds]);

  const fetchStructure = async () => {
    setIsLoading(true);
    try {
      // If parent, fetch for all child projects + parent
      const projectIdsToFetch = isParent && childProjectIds?.length
        ? [projectId, ...childProjectIds]
        : [projectId];

      const allItems: StructureItem[] = [];

      for (const pid of projectIdsToFetch) {
        const res = await fetch(`/project-management/api/conventions?project_id=${pid}&convention_type=structure`);
        const data = await res.json();
        if (data.success && data.conventions) {
          allItems.push(...data.conventions);
        }
      }

      // Sort by created_at descending
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(allItems);
    } catch (error) {
      console.error('Error fetching structure:', error);
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
          convention_type: 'structure',
          name: formData.name,
          description: formData.description,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchStructure();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving structure item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file structure entry?')) return;

    try {
      const res = await fetch(`/project-management/api/conventions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchStructure();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const startEdit = (item: StructureItem) => {
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

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
  });

  // Group items by folder path
  const groupedItems = filteredItems.reduce((acc, item) => {
    // Extract folder from path (description contains full path)
    const path = item.description || '';
    const parts = path.replace(/\\/g, '/').split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'Root';

    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(item);
    return acc;
  }, {} as Record<string, StructureItem[]>);

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
            <FolderTree className="w-5 h-5 text-yellow-400" />
            File Structure
          </h2>
          <p className="text-sm text-gray-400">
            {items.length} files discovered by Jen from transcripts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStructure}
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
            Add File
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
            placeholder="Search files..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">
              {editingId ? 'Edit File Entry' : 'Add File Entry'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">File Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., page.tsx"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Full Path</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., C:/Projects/app/src/page.tsx"
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

      {/* File List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No file structure discovered yet.</p>
          <p className="text-sm mt-1">Jen will extract file paths from your coding sessions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([folder, folderItems]) => (
            <div key={folder} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              {/* Folder Header */}
              <div className="px-4 py-2 bg-gray-750 border-b border-gray-700 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300 text-sm font-mono truncate flex-1">{folder}</span>
                <span className="text-gray-500 text-xs">{folderItems.length} files</span>
              </div>

              {/* Files */}
              <div className="divide-y divide-gray-700">
                {folderItems.map(item => (
                  <div key={item.id} className="px-4 py-3 hover:bg-gray-750 group flex items-center gap-3">
                    {getFileIcon(item.name)}
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-mono text-sm">{item.name}</span>
                      <p className="text-gray-500 text-xs font-mono truncate">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.created_at)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
