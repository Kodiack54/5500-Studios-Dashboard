'use client';

/**
 * HelpdeskContextFlip - Client component to auto-flip context to helpdesk mode
 */

import { useHelpdeskAutoFlip } from '@/app/hooks/useContextAutoFlip';

export default function HelpdeskContextFlip() {
  useHelpdeskAutoFlip();
  return null; // No visual output, just runs the hook
}
