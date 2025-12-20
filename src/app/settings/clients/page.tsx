'use client';

import { useEffect, useState, useContext } from 'react';
import Link from 'next/link';
import { PageTitleContext, PageActionsContext } from '@/app/layout';
import { Building2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  created_at: string;
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
      description: 'Manage dev_clients for projects'
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
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white hover:text-blue-400 transition-colors">{client.name}</h3>
                    <p className="text-gray-400 text-sm">slug: {client.slug}</p>
                    {client.description && (
                      <p className="text-gray-500 text-sm mt-1">{client.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    client.active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {client.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* UUID Display */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs uppercase font-medium">Client UUID:</span>
                  <code className="text-sm text-gray-300 bg-gray-900 px-2 py-1 rounded font-mono">
                    {client.id}
                  </code>
                </div>
                <p className="text-gray-600 text-xs mt-1">
                  Created: {new Date(client.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
