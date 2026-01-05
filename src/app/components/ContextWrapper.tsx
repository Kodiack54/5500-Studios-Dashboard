'use client';

/**
 * ContextWrapper - Connects UserContextProvider with existing user system
 *
 * This component:
 * 1. Gets user ID from existing UserContext
 * 2. Generates/retrieves pc_tag
 * 3. Initializes UserContextProvider
 * 4. Shows Context Gate when needed
 * 5. Shows context toasts
 */

import { useEffect, useState, ReactNode } from 'react';
import { useUser } from '@/app/settings/UserContext';
import { UserContextProvider, useUserContext } from '@/app/contexts/UserContextProvider';
import ContextGateModal from './ContextGateModal';
import ContextToast from './ContextToast';

interface Project {
  id: string;
  name: string;
  slug: string;
}

// Generate or retrieve persistent pc_tag
function getPcTag(): string {
  if (typeof window === 'undefined') return 'server';

  const storageKey = 'kodiack_pc_tag';
  let pcTag = localStorage.getItem(storageKey);

  if (!pcTag) {
    // Generate a unique tag for this browser/device
    const browserInfo = [
      navigator.userAgent.substring(0, 50),
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < browserInfo.length; i++) {
      const char = browserInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    // Get machine name from hostname if available, or use hash
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
    const shortHash = Math.abs(hash).toString(36).substring(0, 6);

    pcTag = `${hostname}-${shortHash}`;
    localStorage.setItem(storageKey, pcTag);
  }

  return pcTag;
}

function ContextInitializer({ children }: { children: ReactNode }) {
  const { user, isLoading: userLoading } = useUser();
  const { setUserIdentity, isLoading: contextLoading } = useUserContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Set user identity when user is loaded
  useEffect(() => {
    if (user && !userLoading) {
      const pcTag = getPcTag();
      setUserIdentity(user.id, pcTag);
    }
  }, [user, userLoading, setUserIdentity]);

  // Fetch projects for context gate
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects?parents_only=true');
        const data = await res.json();
        if (data.success && data.projects) {
          setProjects(data.projects);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setProjectsLoading(false);
      }
    }

    fetchProjects();
  }, []);

  // Show loading state while everything initializes
  if (userLoading || contextLoading || projectsLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <ContextGateModal projects={projects} />
      <ContextToast />
    </>
  );
}

export default function ContextWrapper({ children }: { children: ReactNode }) {
  return (
    <UserContextProvider>
      <ContextInitializer>
        {children}
      </ContextInitializer>
    </UserContextProvider>
  );
}
