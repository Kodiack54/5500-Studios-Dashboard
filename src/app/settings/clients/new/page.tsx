'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageTitleContext, PageActionsContext } from '@/app/layout';
import { Building2, ArrowLeft, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function NewClientPage() {
  const router = useRouter();
  const setPageTitle = useContext(PageTitleContext);
  const setPageActions = useContext(PageActionsContext);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdClient, setCreatedClient] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Set page title
  useEffect(() => {
    setPageTitle({
      title: 'Add Client',
      description: 'Create a new dev_client entry'
    });
    setPageActions(null);

    return () => {
      setPageTitle({ title: '', description: '' });
    };
  }, [setPageTitle, setPageActions]);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    // Generate slug: lowercase, replace spaces with hyphens, remove special chars
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create client');
      }

      // Show success with UUID
      setCreatedClient(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (createdClient) {
      await navigator.clipboard.writeText(createdClient.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Success screen
  if (createdClient) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Client Created!</h2>
            <p className="text-gray-400">Your new client has been added to dev_clients</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <div className="mb-4">
              <p className="text-gray-500 text-xs uppercase font-medium mb-1">Name</p>
              <p className="text-white font-medium">{createdClient.name}</p>
            </div>
            <div className="mb-4">
              <p className="text-gray-500 text-xs uppercase font-medium mb-1">Slug</p>
              <p className="text-gray-300 font-mono">{createdClient.slug}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-medium mb-1">Client UUID</p>
              <div className="flex items-center gap-2">
                <code className="text-blue-400 bg-blue-500/10 px-3 py-2 rounded font-mono text-sm flex-1">
                  {createdClient.id}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Copy UUID"
                >
                  {copiedId ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-gray-600 text-xs mt-2">
                Use this UUID to associate projects with this client
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/settings/clients"
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg text-center hover:bg-gray-600 transition-colors"
            >
              View All Clients
            </Link>
            <button
              onClick={() => {
                setCreatedClient(null);
                setName('');
                setSlug('');
                setDescription('');
              }}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Link */}
      <Link
        href="/settings/clients"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Form Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-700">
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">New Client</h2>
            <p className="text-gray-400 text-sm">Create a dev_client entry with a unique UUID</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., NextBid, Premier Group"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g., nextbid, premier-group"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              required
            />
            <p className="text-gray-500 text-xs mt-1">
              Lowercase alphanumeric with hyphens only. Used for table prefixes.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the client/project..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !name || !slug}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
