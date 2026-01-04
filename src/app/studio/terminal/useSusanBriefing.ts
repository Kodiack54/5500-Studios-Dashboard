// Project context hook - fetches and manages project context from backend

import { useState, useRef, useCallback } from 'react';
import { SUSAN_URL } from './constants';
import type { SusanContext } from './types';

export type MemoryStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Build context prompt to send to Claude on startup
 */
export function buildContextPrompt(context: SusanContext): string {
  if (context.greeting) {
    return context.greeting;
  }
  return "Couldn't load project context. Starting fresh - what would you like to work on?";
}

export function useSusanBriefing(projectPath: string) {
  const [memoryStatus, setMemoryStatus] = useState<MemoryStatus>('idle');
  const [susanContext, setSusanContext] = useState<SusanContext | null>(null);
  const susanContextRef = useRef<SusanContext | null>(null);

  const fetchSusanContext = useCallback(async (): Promise<SusanContext | null> => {
    setMemoryStatus('loading');
    console.log('[useSusanBriefing] Fetching project context...');
    try {
      const response = await fetch(
        `${SUSAN_URL}/api/context?project=${encodeURIComponent(projectPath)}`
      );
      if (response.ok) {
        const context = await response.json();
        console.log('[useSusanBriefing] Context received:', {
          hasGreeting: !!context?.greeting,
          greetingLength: context?.greeting?.length || 0,
          todos: context?.todos?.length || 0,
          ports: context?.ports?.length || 0
        });
        setSusanContext(context);
        susanContextRef.current = context;
        setMemoryStatus('loaded');
        return context;
      } else {
        console.log('[useSusanBriefing] Context API returned non-OK:', response.status);
      }
    } catch (err) {
      console.log('[useSusanBriefing] Context API not available:', err);
    }
    setMemoryStatus('error');
    return null;
  }, [projectPath]);

  const reset = useCallback(() => {
    setMemoryStatus('idle');
    setSusanContext(null);
    susanContextRef.current = null;
  }, []);

  return {
    memoryStatus,
    susanContext,
    susanContextRef,
    fetchSusanContext,
    reset,
  };
}
