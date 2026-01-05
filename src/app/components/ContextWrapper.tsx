'use client';

/**
 * ContextWrapper - Provides user context to the app
 * NO gate modal. NO popup. Just provides context.
 */

import { useEffect, ReactNode } from 'react';
import { useUser } from '@/app/settings/UserContext';
import { UserContextProvider, useUserContext } from '@/app/contexts/UserContextProvider';

// Generate or retrieve persistent pc_tag
function getPcTag(): string {
  if (typeof window === 'undefined') return 'server';

  const storageKey = 'kodiack_pc_tag';
  let pcTag = localStorage.getItem(storageKey);

  if (!pcTag) {
    const browserInfo = [
      navigator.userAgent.substring(0, 50),
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ].join('|');

    let hash = 0;
    for (let i = 0; i < browserInfo.length; i++) {
      const char = browserInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
    const shortHash = Math.abs(hash).toString(36).substring(0, 6);
    pcTag = `${hostname}-${shortHash}`;
    localStorage.setItem(storageKey, pcTag);
  }

  return pcTag;
}

function ContextInitializer({ children }: { children: ReactNode }) {
  const { user, isLoading: userLoading } = useUser();
  const { setUserIdentity } = useUserContext();

  // Set user identity when user is loaded
  useEffect(() => {
    if (user && !userLoading) {
      const pcTag = getPcTag();
      setUserIdentity(user.id, pcTag);
    }
  }, [user, userLoading, setUserIdentity]);

  // Just render children - no gate, no modal
  return <>{children}</>;
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
