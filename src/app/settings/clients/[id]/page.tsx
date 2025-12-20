'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageTitleContext, PageActionsContext } from '@/app/layout';
import { Building2, ArrowLeft, FolderGit2, Users, Plus, Trash2, Copy, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  server_path: string;
  local_path: string | null;
  git_repo: string | null;
  droplet_name: string | null;
  droplet_ip: string | null;
  port_dev: number | null;
  port_test: number | null;
  port_prod: number | null;
  is_active: boolean;
}

interface AssignedDev {
  assignment_id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  user_role: string;
  assigned_at: string;
}

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

interface Client {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  created_at: string;
  projects: Project[];
  assignedDevs: AssignedDev[];
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const setPageTitle = useContext(PageTitleContext);
  const setPageActions = useContext(PageActionsContext);

  const [client, setClient] = useState<Client | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    slug: '',
    description: '',
    server_path: '',
    local_path: '',
    git_repo: '',
    droplet_name: '',
    droplet_ip: '',
    port_dev: '',
    port_test: '',
    port_prod: '',
    table_prefix: '',
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [devRole, setDevRole] = useState('developer');
  const [submitting, setSubmitting] = useState(false);

  // Set page title
  useEffect(() => {
    if (client) {
      setPageTitle({
        title: client.name,
        description: `Manage projects and team for ${client.slug}`,
      });
    }
    setPageActions(null);

    return () => {
      setPageTitle({ title: '', description: '' });
    };
  }, [client, setPageTitle, setPageActions]);

  // Load client and users
  useEffect(() => {
    async function loadData() {
      try {
        const [clientRes, usersRes] = await Promise.all([
          fetch(`/api/clients/${clientId}`),
          fetch('/api/users'),
        ]);

        if (!clientRes.ok) throw new Error('Failed to load client');
        const clientData = await clientRes.json();
        setClient(clientData);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [clientId]);

  const copyToClipboard = async () => {
    if (client) {
      await navigator.clipboard.writeText(client.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleProjectNameChange = (value: string) => {
    setProjectForm({
      ...projectForm,
      name: value,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim(),
    });
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectForm,
          port_dev: projectForm.port_dev ? parseInt(projectForm.port_dev) : null,
          port_test: projectForm.port_test ? parseInt(projectForm.port_test) : null,
          port_prod: projectForm.port_prod ? parseInt(projectForm.port_prod) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create project');
      }

      // Reload client data
      const clientRes = await fetch(`/api/clients/${clientId}`);
      const clientData = await clientRes.json();
      setClient(clientData);

      setShowProjectModal(false);
      setProjectForm({
        name: '',
        slug: '',
        description: '',
        server_path: '',
        local_path: '',
        git_repo: '',
        droplet_name: '',
        droplet_ip: '',
        port_dev: '',
        port_test: '',
        port_prod: '',
        table_prefix: '',
      });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignDev = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/devs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUserId, role: devRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign dev');
      }

      // Reload client data
      const clientRes = await fetch(`/api/clients/${clientId}`);
      const clientData = await clientRes.json();
      setClient(clientData);

      setShowDevModal(false);
      setSelectedUserId('');
      setDevRole('developer');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDev = async (assignmentId: string) => {
    if (!confirm('Remove this developer from the client?')) return;

    try {
      const res = await fetch(`/api/clients/${clientId}/devs?assignmentId=${assignmentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove dev');

      // Reload client data
      const clientRes = await fetch(`/api/clients/${clientId}`);
      const clientData = await clientRes.json();
      setClient(clientData);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // Filter out already assigned users
  const availableUsers = users.filter(
    (u) => !client?.assignedDevs.some((d) => d.user_id === u.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading client...</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error || 'Client not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/settings/clients"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Client Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{client.name}</h2>
              <p className="text-gray-400">slug: {client.slug}</p>
              {client.description && (
                <p className="text-gray-500 mt-1">{client.description}</p>
              )}
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              client.active
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {client.active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* UUID */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs uppercase font-medium">Client UUID:</span>
            <code className="text-sm text-gray-300 bg-gray-900 px-2 py-1 rounded font-mono">
              {client.id}
            </code>
            <button
              onClick={copyToClipboard}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Copy UUID"
            >
              {copiedId ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Projects</h3>
              <span className="text-sm text-gray-500">({client.projects.length})</span>
            </div>
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          </div>

          {client.projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderGit2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No projects yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {client.projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">{project.name}</h4>
                      <p className="text-gray-500 text-sm font-mono">{project.slug}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        project.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {project.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-gray-400 text-sm mt-2">{project.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {project.droplet_ip && (
                      <span className="bg-gray-800 px-2 py-1 rounded text-gray-400">
                        {project.droplet_name || project.droplet_ip}
                      </span>
                    )}
                    {project.port_dev && (
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        Dev: {project.port_dev}
                      </span>
                    )}
                    {project.port_prod && (
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        Prod: {project.port_prod}
                      </span>
                    )}
                    {project.git_repo && (
                      <a
                        href={project.git_repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded text-gray-400 hover:text-white"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Git
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Devs Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Assigned Developers</h3>
              <span className="text-sm text-gray-500">({client.assignedDevs.length})</span>
            </div>
            <button
              onClick={() => setShowDevModal(true)}
              disabled={availableUsers.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Assign Dev
            </button>
          </div>

          {client.assignedDevs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No developers assigned</p>
            </div>
          ) : (
            <div className="space-y-3">
              {client.assignedDevs.map((dev) => (
                <div
                  key={dev.assignment_id}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-medium text-white">
                      {dev.first_name || dev.last_name
                        ? `${dev.first_name || ''} ${dev.last_name || ''}`.trim()
                        : dev.email}
                    </h4>
                    <p className="text-gray-500 text-sm">{dev.email}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                        {dev.role}
                      </span>
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                        {dev.user_role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDev(dev.assignment_id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                    title="Remove from client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Project Modal */}
      {showProjectModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowProjectModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-xl shadow-xl z-50 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Add Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(e) => handleProjectNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={projectForm.slug}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Server Path *
                </label>
                <input
                  type="text"
                  value={projectForm.server_path}
                  onChange={(e) => setProjectForm({ ...projectForm, server_path: e.target.value })}
                  placeholder="/var/www/project-name"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Local Path
                </label>
                <input
                  type="text"
                  value={projectForm.local_path}
                  onChange={(e) => setProjectForm({ ...projectForm, local_path: e.target.value })}
                  placeholder="C:\Projects\project-name"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Droplet Name
                  </label>
                  <input
                    type="text"
                    value={projectForm.droplet_name}
                    onChange={(e) => setProjectForm({ ...projectForm, droplet_name: e.target.value })}
                    placeholder="Development"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Droplet IP
                  </label>
                  <input
                    type="text"
                    value={projectForm.droplet_ip}
                    onChange={(e) => setProjectForm({ ...projectForm, droplet_ip: e.target.value })}
                    placeholder="161.35.229.220"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Dev Port
                  </label>
                  <input
                    type="number"
                    value={projectForm.port_dev}
                    onChange={(e) => setProjectForm({ ...projectForm, port_dev: e.target.value })}
                    placeholder="3000"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Test Port
                  </label>
                  <input
                    type="number"
                    value={projectForm.port_test}
                    onChange={(e) => setProjectForm({ ...projectForm, port_test: e.target.value })}
                    placeholder="3001"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Prod Port
                  </label>
                  <input
                    type="number"
                    value={projectForm.port_prod}
                    onChange={(e) => setProjectForm({ ...projectForm, port_prod: e.target.value })}
                    placeholder="8080"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Git Repository
                  </label>
                  <input
                    type="text"
                    value={projectForm.git_repo}
                    onChange={(e) => setProjectForm({ ...projectForm, git_repo: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Table Prefix
                  </label>
                  <input
                    type="text"
                    value={projectForm.table_prefix}
                    onChange={(e) => setProjectForm({ ...projectForm, table_prefix: e.target.value })}
                    placeholder="client_"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Assign Dev Modal */}
      {showDevModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowDevModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-xl shadow-xl z-50 p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Assign Developer</h3>
            <form onSubmit={handleAssignDev} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Select Developer
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select a developer...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : user.email}{' '}
                      ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role on this Client
                </label>
                <select
                  value={devRole}
                  onChange={(e) => setDevRole(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="developer">Developer</option>
                  <option value="lead">Lead Developer</option>
                  <option value="manager">Project Manager</option>
                  <option value="support">Support</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowDevModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedUserId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign Developer'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
