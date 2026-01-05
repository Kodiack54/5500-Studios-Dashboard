'use client';

/**
 * ContextIndicator - Shows current context in the header
 *
 * Dark/minimal styling. Just shows what you're working on.
 * Updates reactively when tabs are clicked.
 */

import { Code2, Hammer, Headphones, Settings, Map, Users, Coffee } from 'lucide-react';
import { useUserContext, ContextMode, MODE_LABELS } from '@/app/contexts/UserContextProvider';

const MODE_ICONS: Record<ContextMode, React.ElementType> = {
  project: Code2,
  forge: Hammer,
  helpdesk: Headphones,
  ops: Settings,
  roadmap: Map,
  meeting: Users,
  break: Coffee,
};

export default function ContextIndicator() {
  const { context, hasActiveContext, isLoading } = useUserContext();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-xl text-gray-400 text-sm border border-gray-600">
        <div className="w-4 h-4 rounded-full bg-gray-600 animate-pulse" />
        <span>...</span>
      </div>
    );
  }

  // No context yet - show neutral indicator (context will be set when user clicks a tab)
  if (!hasActiveContext || !context) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-xl text-gray-400 text-sm border border-gray-600">
        <span>—</span>
      </div>
    );
  }

  const Icon = MODE_ICONS[context.mode] || Code2;

  // Display text based on mode
  const displayText = context.mode === 'project'
    ? (context.project_slug || 'Project')
    : MODE_LABELS[context.mode];

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-xl text-white text-sm border border-gray-600">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="font-medium">{displayText}</span>
    </div>
  );
}
