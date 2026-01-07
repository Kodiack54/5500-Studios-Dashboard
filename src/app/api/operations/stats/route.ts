/**
 * Operations Stats API Route
 * Thin wrapper - logic lives in /app/operations/api/stats.ts
 */

import { getOperationsStats } from '@/app/operations/api/stats';

export async function GET() {
  return getOperationsStats();
}
