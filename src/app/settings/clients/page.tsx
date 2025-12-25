'use client';

import { useEffect, useState, useContext } from 'react';
import Link from 'next/link';
import { PageTitleContext, PageActionsContext } from '@/app/layout';
import { Building2, User } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface Client {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  client_type: string;
  logo_url: string | null;
  active: boolean;
  created_at: string;
  team: TeamMember[];
  projects: Project[];
}

// Get initials from name
function getInitials(member: TeamMember): string {
  if (member.first_name && member.last_name) {
    return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
  }
  if (member.name) {
    const parts = member.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return member.name.substring(0, 2).toUpperCase();
  }
  return member.email.substring(0, 2).toUpperCase();
}

// Get project abbreviation
function getProjectAbbr(project: Project): string {
  // Common abbreviations
  const abbrs: Record<string, string> = {
    'nextbid': 'NB',
    'nextbidder': 'NB',
    'nextsource': 'NS',
    'nexttech': 'NT',
    'nexttask': 'NT',
  };

  const slug = project.slug.toLowerCase();
  if (abbrs[slug]) return abbrs[slug];

  // Generate from name - take first letters of words
  const words = project.name.split(/[\s-]+/);
  if (words.length >= 2) {
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
  return project.name.substring(0, 2).toUpperCase();
}

export default function ClientsPage() {
  const setPageTitle = useContext(PageTitleContext);
  const setPageActions = useContext(PageActionsContext);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Set page title and actions
  useEffect(() => {
    setPageTitle({
      title: 'Clients',
      description: 'Manage clients and their projects'
    });
    setPageActions(
      <Link
        href="/settings/clients/new"
        className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors border border-white/30"
      >
        + Add Client
      </Link>
    );

    return () => {
      setPageTitle({ title: '', description: '' });
      setPageActions(null);
    };
  }, [setPageTitle, setPageActions]);

  // Load clients
  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch('/api/clients');
        if (!res.ok) throw new Error('Failed to load clients');
        const data = await res.json();
        setClients(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadClients();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading clients...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No clients yet</p>
          <Link
            href="/settings/clients/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Client
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/settings/clients/${client.id}`}
              className="block bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Client Logo or Icon */}
                  {client.logo_url ? (
                    <img
                      src={client.logo_url}
                      alt={client.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      client.client_type === 'individual'
                        ? 'bg-purple-600/20'
                        : 'bg-blue-600/20'
                    }`}>
                      {client.client_type === 'individual' ? (
                        <User className="w-6 h-6 text-purple-400" />
                      ) : (
                        <Building2 className="w-6 h-6 text-blue-400" />
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white hover:text-blue-400 transition-colors">
                      {client.name}
                    </h3>
                    {client.description && (
                      <p className="text-gray-500 text-sm mt-0.5">{client.description}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  client.active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {client.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Team & Projects Row */}
              <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                {/* Team Members */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs uppercase font-medium mr-1">Team:</span>
                  {client.team.length === 0 ? (
                    <span className="text-gray-600 text-sm">No team assigned</span>
                  ) : (
                    <div className="flex -space-x-2">
                      {client.team.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-800"
                          title={member.first_name ? `${member.first_name} ${member.last_name || ''}` : member.email}
                        >
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            getInitials(member)
                          )}
                        </div>
                      ))}
                      {client.team.length > 5 && (
                        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-gray-800">
                          +{client.team.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Projects */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs uppercase font-medium mr-1">Projects:</span>
                  {client.projects.length === 0 ? (
                    <span className="text-gray-600 text-sm">No projects</span>
                  ) : (
                    <div className="flex gap-1">
                      {client.projects.slice(0, 6).map((project) => (
                        <div
                          key={project.id}
                          className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-300 text-xs font-bold"
                          title={project.name}
                        >
                          {project.logo_url ? (
                            <img src={project.logo_url} alt="" className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            getProjectAbbr(project)
                          )}
                        </div>
                      ))}
                      {client.projects.length > 6 && (
                        <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center text-gray-400 text-xs font-bold">
                          +{client.projects.length - 6}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
