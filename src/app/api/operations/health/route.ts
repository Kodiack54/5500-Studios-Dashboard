/**
 * Operations Health API Route
 * Thin wrapper - logic lives in /app/operations/api/health.ts
 */

import { getOperationsHealth } from '@/app/operations/api/health';

export async function GET() {
  return getOperationsHealth();
}
