// Chad transcription hook - connects to Chad for session logging

import { useRef, useCallback } from 'react';
import { DEV_DROPLET } from './constants';

export function useChadTranscription(projectPath: string, userId?: string, userName?: string, chadPort: number = 5401) {
  const chadWsRef = useRef<WebSocket | null>(null);
  const chadSessionIdRef = useRef<string | null>(null);

  const connectToChad = useCallback(() => {
    if (!userId) {
      console.log('[ClaudeTerminal] No user ID available for Chad connection');
      return;
    }

    try {
      // Chad port is terminal port + 1 (e.g., 5410 → 5411, 5420 → 5421)
      const chadWsUrl = `ws://${DEV_DROPLET}:${chadPort}/ws`;
      console.log('[ClaudeTerminal] Connecting to Chad at:', chadWsUrl);

      const chadWs = new WebSocket(
        `${chadWsUrl}?project=${encodeURIComponent(projectPath)}&userId=${userId}&userName=${encodeURIComponent(userName || '')}`
      );

      chadWs.onopen = () => {
        console.log('[ClaudeTerminal] Connected to Chad for transcription');
        chadWs.send(JSON.stringify({ type: 'session_start', payload: {} }));
      };

      chadWs.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'session_started' || msg.type === 'session_created') {
            chadSessionIdRef.current = msg.sessionId;
            console.log('[ClaudeTerminal] Chad session started:', msg.sessionId);
          }
        } catch (err) {
          console.log('[ClaudeTerminal] Chad message parse error:', err);
        }
      };

      chadWs.onerror = (err) => console.log('[ClaudeTerminal] Chad WebSocket error:', err);
      chadWs.onclose = () => {
        console.log('[ClaudeTerminal] Chad disconnected');
        chadSessionIdRef.current = null;
      };

      chadWsRef.current = chadWs;
    } catch (err) {
      console.log('[ClaudeTerminal] Could not connect to Chad:', err);
    }
  }, [projectPath, userId, userName, chadPort]);

  const sendToChad = useCallback((data: string) => {
    if (chadWsRef.current?.readyState === WebSocket.OPEN) {
      chadWsRef.current.send(JSON.stringify({
        type: 'terminal_output',
        payload: {
          sessionId: chadSessionIdRef.current,
          data
        }
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    chadWsRef.current?.close();
    chadWsRef.current = null;
    chadSessionIdRef.current = null;
  }, []);

  return {
    chadWsRef,
    chadSessionIdRef,
    connectToChad,
    sendToChad,
    disconnect,
  };
}
