'use client';

/**
 * ContextIndicator - Shows current context in the header
 *
 * Displays:
 * - Current mode (Project/Forge/Helpdesk/etc)
 * - Project name + dev team (if mode=project)
 * - Click opens Context Gate modal
 */

import { Code2, Hammer, Headphones, Settings, Map, Users, Coffee, ChevronDown } from 'lucide-react';
import { useUserContext, ContextMode, MODE_LABELS, MODE_COLORS } from '@/app/contexts/UserContextProvider';

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
  const { context, hasActiveContext, setShowContextGate, isLoading } = useUserContext();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg text-gray-400 text-sm">
        <div className="w-4 h-4 rounded-full bg-gray-600 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!hasActiveContext || !context) {
    return (
      <button
        onClick={() => setShowContextGate(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-white text-sm transition-colors"
      >
        <span className="font-medium">No Context Set</span>
        <ChevronDown className="w-4 h-4" />
      </button>
    );
  }

  const Icon = MODE_ICONS[context.mode] || Code2;
  const bgColor = MODE_COLORS[context.mode] || 'bg-gray-600';

  return (
    <button
      onClick={() => setShowContextGate(true)}
      className={`flex items-center gap-2 px-3 py-1.5 ${bgColor} rounded-lg text-white text-sm transition-all hover:opacity-90`}
    >
      <Icon className="w-4 h-4" />
      <div className="flex items-center gap-1.5">
        {context.mode === 'project' ? (
          <>
            <span className="font-medium">{context.project_slug || 'Project'}</span>
            {context.dev_team && (
              <span className="text-white/70">({context.dev_team})</span>
            )}
          </>
        ) : (
          <span className="font-medium">{MODE_LABELS[context.mode]}</span>
        )}
      </div>
      <ChevronDown className="w-4 h-4 opacity-70" />
    </button>
  );
}
