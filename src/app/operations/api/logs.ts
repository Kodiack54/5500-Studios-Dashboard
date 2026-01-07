/**
 * Operations Logs Logic
 * Fetch PM2 logs for a specific service
 */

import { NextResponse } from 'next/server';
import { STUDIO_SERVICES } from '../config';
import { LogsResponse } from '../lib/types';

/**
 * Get logs for a specific service
 * Note: This requires server-side access to PM2 logs
 * For now returns placeholder - needs SSH or server endpoint
 */
export async function getServiceLogs(serviceId: string, lines: number = 100): Promise<LogsResponse> {
  const service = STUDIO_SERVICES.find(s => s.id === serviceId);

  if (!service) {
    return {
      success: false,
      serviceId,
      logs: [],
      timestamp: Date.now(),
    };
  }

  // TODO: Implement real log fetching
  // Options:
  // 1. Create a logs endpoint on router-9500 that reads PM2 logs
  // 2. Use SSH to execute pm2 logs command
  // 3. Read log files directly if mounted/accessible

  // Placeholder response
  return {
    success: true,
    serviceId,
    logs: [
      `[${new Date().toISOString()}] Logs for ${service.label} (${service.pm2Name || 'no pm2 name'})`,
      `[${new Date().toISOString()}] PM2 log fetching not yet implemented`,
      `[${new Date().toISOString()}] Service type: ${service.type}`,
      `[${new Date().toISOString()}] Port: ${service.port || 'N/A'}`,
    ],
    timestamp: Date.now(),
  };
}

/**
 * GET handler for Next.js API route wrapper
 */
export async function getOperationsLogs(serviceId: string, lines?: number): Promise<NextResponse> {
  try {
    const logs = await getServiceLogs(serviceId, lines);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('[Operations Logs] Error:', error);
    return NextResponse.json(
      { success: false, serviceId, logs: [], timestamp: Date.now(), error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
