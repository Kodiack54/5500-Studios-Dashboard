'use client';

/**
 * UserContextProvider - GLOBAL SOURCE OF TRUTH
 *
 * Context is set by tab navigation (auto-flip hooks).
 * NO gate modal. NO popup. Just provides context state.
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type ContextMode = 'project' | 'forge' | 'helpdesk' | 'ops' | 'roadmap' | 'meeting' | 'break';
export type ContextSource = 'universal' | 'studio' | 'autoflip' | 'timeclock' | 'manual';

export interface UserContext {
  id: string;
  user_id: string;
  pc_tag: string;
  mode: ContextMode;
  project_id: string | null;
  project_slug: string | null;
  dev_team: string | null;
  started_at: string;
  updated_at: string;
  ended_at: string | null;
  source: ContextSource;
  locked: boolean;
}

interface UserContextValue {
  // Current context state
  context: UserContext | null;
  isLoading: boolean;
  hasActiveContext: boolean;

  // Actions
  fetchContext: () => Promise<void>;
  setContext: (params: SetContextParams) => Promise<boolean>;
  flipContext: (mode: ContextMode, projectId?: string, projectSlug?: string, devTeam?: string) => Promise<boolean>;
  endContext: () => Promise<void>;

  // User identity (set on login)
  userId: string | null;
  pcTag: string | null;
  setUserIdentity: (userId: string, pcTag: string) => void;
}

interface SetContextParams {
  mode: ContextMode;
  project_id?: string | null;
  project_slug?: string | null;
  dev_team?: string | null;
  source: ContextSource;
}

const UserContextContext = createContext<UserContextValue>({
  context: null,
  isLoading: true,
  hasActiveContext: false,
  fetchContext: async () => {},
  setContext: async () => false,
  flipContext: async () => false,
  endContext: async () => {},
  userId: null,
  pcTag: null,
  setUserIdentity: () => {},
});

export function UserContextProvider({ children }: { children: ReactNode }) {
  const [context, setContextState] = useState<UserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [pcTag, setPcTag] = useState<string | null>(null);

  const hasActiveContext = !!context;

  const setUserIdentity = useCallback((newUserId: string, newPcTag: string) => {
    setUserId(newUserId);
    setPcTag(newPcTag);
  }, []);

  const fetchContext = useCallback(async () => {
    if (!userId || !pcTag) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/context?user_id=${userId}&pc_tag=${encodeURIComponent(pcTag)}`);
      const data = await res.json();

      if (data.success) {
        setContextState(data.context);
        // NO gate popup - just set context silently
      }
    } catch (error) {
      console.error('[UserContext] Failed to fetch context:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, pcTag]);

  const setContext = useCallback(async (params: SetContextParams): Promise<boolean> => {
    if (!userId || !pcTag) return false;

    try {
      const res = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          pc_tag: pcTag,
          ...params,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setContextState(data.context);
        return true;
      } else {
        console.error('[UserContext] Failed to set context:', data.error);
        return false;
      }
    } catch (error) {
      console.error('[UserContext] Error setting context:', error);
      return false;
    }
  }, [userId, pcTag]);

  // Convenience method for auto-flip (called by tab navigation hooks)
  const flipContext = useCallback(async (
    mode: ContextMode,
    projectId?: string,
    projectSlug?: string,
    devTeam?: string
  ): Promise<boolean> => {
    return setContext({
      mode,
      project_id: projectId || null,
      project_slug: projectSlug || null,
      dev_team: devTeam || null,
      source: 'autoflip',
    });
  }, [setContext]);

  const endContext = useCallback(async () => {
    if (!userId || !pcTag) return;

    try {
      const res = await fetch(`/api/context?user_id=${userId}&pc_tag=${encodeURIComponent(pcTag)}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setContextState(null);
      }
    } catch (error) {
      console.error('[UserContext] Error ending context:', error);
    }
  }, [userId, pcTag]);

  // Fetch context when user identity is set
  useEffect(() => {
    if (userId && pcTag) {
      fetchContext();
    }
  }, [userId, pcTag, fetchContext]);

  return (
    <UserContextContext.Provider value={{
      context,
      isLoading,
      hasActiveContext,
      fetchContext,
      setContext,
      flipContext,
      endContext,
      userId,
      pcTag,
      setUserIdentity,
    }}>
      {children}
    </UserContextContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContextContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
}

// Mode display helpers
export const MODE_LABELS: Record<ContextMode, string> = {
  project: 'Project',
  forge: 'Forge',
  helpdesk: 'Helpdesk',
  ops: 'Ops',
  roadmap: 'Roadmap',
  meeting: 'Meeting',
  break: 'Break',
};
