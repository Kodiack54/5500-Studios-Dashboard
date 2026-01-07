/**
 * Operations Health Logic
 * Checks PM2 status and /health endpoints for all studio services
 */

import { NextResponse } from 'next/server';
import { STUDIO_SERVICES, StudioService, ServiceStatus } from '../config';
import { ServiceHealth, HealthResponse } from '../lib/types';

// Server where services run
const SERVER_HOST = process.env.SERVER_HOST || '161.35.229.220';

// Timeout for health pings (ms)
const HEALTH_TIMEOUT = 3000;

/**
 * Ping a service's /health endpoint
 */
async function pingHealthEndpoint(service: StudioService): Promise<{ ok: boolean; data?: any }> {
  if (!service.healthEndpoint || !service.port) {
    return { ok: false };
  }

  try {
    const url = `http://${SERVER_HOST}:${service.port}${service.healthEndpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(HEALTH_TIMEOUT),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return { ok: true, data };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

/**
 * Get PM2 status for all services via SSH command execution
 * This returns mocked data for now - needs server-side PM2 endpoint
 */
async function getPM2Status(): Promise<Record<string, { status: string; cpu?: number; memory?: number; uptime?: number }>> {
  // TODO: Implement real PM2 status fetch
  // Options:
  // 1. Create a PM2 status endpoint on the server (e.g., on router-9500)
  // 2. Use SSH via a server-side script
  // 3. Use PM2 API if available

  // For now, we'll derive status from health endpoint pings
  return {};
}

/**
 * Determine service status based on type and checks
 */
function determineStatus(
  service: StudioService,
  healthPing: boolean,
  pm2Status?: string,
  lastEventTime?: number
): ServiceStatus {
  // PC emitters: check last event time
  if (service.type === 'pc_emitter') {
    if (!lastEventTime) return 'unknown';
    const minutesSince = (Date.now() - lastEventTime) / 60000;
    if (minutesSince < 5) return 'online';
    if (minutesSince < 30) return 'degraded';
    return 'offline';
  }

  // Services with health endpoints
  if (service.healthEndpoint) {
    return healthPing ? 'online' : 'offline';
  }

  // PM2 services without health endpoint
  if (pm2Status === 'online') return 'online';
  if (pm2Status === 'stopped' || pm2Status === 'errored') return 'offline';

  return 'unknown';
}

/**
 * Check health of all studio services
 */
export async function checkAllServicesHealth(): Promise<HealthResponse> {
  const pm2Statuses = await getPM2Status();

  // Check all services in parallel
  const healthChecks = await Promise.all(
    STUDIO_SERVICES.map(async (service): Promise<ServiceHealth> => {
      const healthPing = await pingHealthEndpoint(service);
      const pm2 = pm2Statuses[service.pm2Name || ''];

      return {
        id: service.id,
        status: determineStatus(service, healthPing.ok, pm2?.status),
        pm2Status: pm2?.status as ServiceHealth['pm2Status'],
        healthPing: healthPing.ok,
        cpu: pm2?.cpu,
        memory: pm2?.memory,
        uptime: pm2?.uptime,
      };
    })
  );

  return {
    success: true,
    services: healthChecks,
    timestamp: Date.now(),
  };
}

/**
 * Check health of a single service
 */
export async function checkServiceHealth(serviceId: string): Promise<ServiceHealth | null> {
  const service = STUDIO_SERVICES.find(s => s.id === serviceId);
  if (!service) return null;

  const healthPing = await pingHealthEndpoint(service);
  const pm2Statuses = await getPM2Status();
  const pm2 = pm2Statuses[service.pm2Name || ''];

  return {
    id: service.id,
    status: determineStatus(service, healthPing.ok, pm2?.status),
    pm2Status: pm2?.status as ServiceHealth['pm2Status'],
    healthPing: healthPing.ok,
    cpu: pm2?.cpu,
    memory: pm2?.memory,
    uptime: pm2?.uptime,
  };
}

/**
 * GET handler for Next.js API route wrapper
 */
export async function getOperationsHealth(): Promise<NextResponse> {
  try {
    const health = await checkAllServicesHealth();
    return NextResponse.json(health);
  } catch (error) {
    console.error('[Operations Health] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Health check failed', services: [], timestamp: Date.now() },
      { status: 500 }
    );
  }
}
