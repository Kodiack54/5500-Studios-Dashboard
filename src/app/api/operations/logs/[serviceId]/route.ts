/**
 * Operations Logs API Route
 * Thin wrapper - logic lives in /app/operations/api/logs.ts
 */

import { NextRequest } from 'next/server';
import { getOperationsLogs } from '@/app/operations/api/logs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params;
  const { searchParams } = new URL(request.url);
  const lines = parseInt(searchParams.get('lines') || '100', 10);

  return getOperationsLogs(serviceId, lines);
}
