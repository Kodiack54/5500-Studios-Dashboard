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
 * Get PM2 status for all services by executing pm2 jlist directly
 * This runs server-side on the droplet where PM2 is installed
 */
async function getPM2Status(): Promise<Record<string, { status: string; cpu?: number; memory?: number; uptime?: number }>> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync('pm2 jlist', { timeout: 5000 });
    const processes = JSON.parse(stdout);

    const status: Record<string, { status: string; cpu?: number; memory?: number; uptime?: number }> = {};

    for (const proc of processes) {
      status[proc.name] = {
        status: proc.pm2_env?.status || 'unknown',
        cpu: proc.monit?.cpu || 0,
        memory: proc.monit?.memory || 0,
        uptime: proc.pm2_env?.pm_uptime || 0,
      };
    }

    return status;
  } catch (error) {
    console.error('[Operations Health] PM2 status fetch failed:', error);
    return {};
  }
}

/**
 * Determine service status based on type and checks
 */
function determineStatus(
  service: StudioService,
  healthPing: boolean,
  pm2Status?: string,
  pcHealth?: { heartbeatTime?: number; transcriptTime?: number; idleSeconds?: number; status?: string }
): ServiceStatus {
  // PC emitters WITHOUT PM2 (user-pc): check heartbeat from active-sessions
  if (service.type === 'pc_emitter' && !service.pm2Name) {
    // Use active-sessions status if available
    if (pcHealth?.status) {
      if (pcHealth.status === 'active') return 'online';
      if (pcHealth.status === 'idle') return 'degraded';
      return 'offline';
    }
    // Fallback to heartbeat time with thresholds: <120s = online, <300s = degraded, >=300s = offline
    if (!pcHealth?.heartbeatTime) return 'unknown';
    const secondsSince = (Date.now() - pcHealth.heartbeatTime) / 1000;
    if (secondsSince < 120) return 'online';
    if (secondsSince < 300) return 'degraded';
    return 'offline';
  }

  // PC emitters WITH PM2 (terminal-5400): use PM2 status
  if (service.type === 'pc_emitter' && service.pm2Name) {
    if (pm2Status === 'online') return 'online';
    if (pm2Status === 'stopped' || pm2Status === 'errored') return 'offline';
    return 'unknown';
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
 * Get PC health from active-sessions and event times
 * Returns heartbeat time (for online/offline) and transcript time (for tailer status)
 */
async function getPCHealth(): Promise<{
  heartbeatTime?: number;
  transcriptTime?: number;
  idleSeconds?: number;
  status?: string;
}> {
  try {
    // First try active-sessions for authoritative status
    const sessionRes = await fetch(`http://${SERVER_HOST}:9200/v1/ops/active-sessions`, {
      signal: AbortSignal.timeout(3000),
    });

    if (sessionRes.ok) {
      const data = await sessionRes.json();
      const pcSession = data.sessions?.find((s: any) => s.pc_tag === 'michael-premtech');

      if (pcSession) {
        // Get last transcript event time from ops events
        const { Pool } = await import('pg');
        const pool = new Pool({
          host: process.env.PG_HOST || '161.35.229.220',
          port: parseInt(process.env.PG_PORT || '9432'),
          database: process.env.PG_DATABASE || 'kodiack_ai',
          user: process.env.PG_USER || 'kodiack_admin',
          password: process.env.PG_PASSWORD || 'K0d1ack_Pr0d_2025_Rx9',
        });

        const result = await pool.query(`
          SELECT MAX(timestamp) as last_transcript
          FROM dev_ops_events
          WHERE service_id = 'user-pc'
            AND event_type = 'pc_transcript_sent'
            AND timestamp > NOW() - INTERVAL '1 hour'
        `);
        await pool.end();

        const transcriptTime = result.rows[0]?.last_transcript
          ? new Date(result.rows[0].last_transcript).getTime()
          : undefined;

        return {
          heartbeatTime: Date.now() - (pcSession.idle_seconds * 1000),
          transcriptTime,
          idleSeconds: pcSession.idle_seconds,
          status: pcSession.status,
        };
      }
    }

    // Fallback: query events directly
    const { Pool } = await import('pg');
    const pool = new Pool({
      host: process.env.PG_HOST || '161.35.229.220',
      port: parseInt(process.env.PG_PORT || '9432'),
      database: process.env.PG_DATABASE || 'kodiack_ai',
      user: process.env.PG_USER || 'kodiack_admin',
      password: process.env.PG_PASSWORD || 'K0d1ack_Pr0d_2025_Rx9',
    });

    const result = await pool.query(`
      SELECT event_type, MAX(timestamp) as last_event
      FROM dev_ops_events
      WHERE service_id = 'user-pc'
        AND event_type IN ('pc_heartbeat', 'pc_transcript_sent')
        AND timestamp > NOW() - INTERVAL '1 hour'
      GROUP BY event_type
    `);
    await pool.end();

    const times: { heartbeatTime?: number; transcriptTime?: number } = {};
    for (const row of result.rows) {
      const eventTime = new Date(row.last_event).getTime();
      if (row.event_type === 'pc_heartbeat') {
        times.heartbeatTime = eventTime;
      } else if (row.event_type === 'pc_transcript_sent') {
        times.transcriptTime = eventTime;
      }
    }
    return times;
  } catch (error) {
    console.error('[Operations Health] PC health fetch failed:', error);
    return {};
  }
}

/**
 * Check health of all studio services
 */
export async function checkAllServicesHealth(): Promise<HealthResponse> {
  const [pm2Statuses, pcHealth] = await Promise.all([
    getPM2Status(),
    getPCHealth(),
  ]);

  // Check all services in parallel
  const healthChecks = await Promise.all(
    STUDIO_SERVICES.map(async (service): Promise<ServiceHealth> => {
      const healthPing = await pingHealthEndpoint(service);
      const pm2 = pm2Statuses[service.pm2Name || ''];

      // For user-pc, include additional tailer status info
      const isUserPC = service.id === 'user-pc';
      const baseHealth: ServiceHealth = {
        id: service.id,
        status: determineStatus(service, healthPing.ok, pm2?.status, isUserPC ? pcHealth : undefined),
        pm2Status: pm2?.status as ServiceHealth['pm2Status'],
        healthPing: healthPing.ok,
        cpu: pm2?.cpu,
        memory: pm2?.memory,
        uptime: pm2?.uptime,
      };

      // Add tailer status for user-pc
      if (isUserPC && pcHealth.heartbeatTime) {
        const transcriptAge = pcHealth.transcriptTime
          ? (Date.now() - pcHealth.transcriptTime) / 1000
          : Infinity;

        // Tailer warning: heartbeat is fresh but no transcript in 15 min (900s)
        if (transcriptAge > 900 && pcHealth.idleSeconds !== undefined && pcHealth.idleSeconds < 300) {
          (baseHealth as any).tailerWarning = 'Tailer may be down - no transcripts in 15+ min';
        }
      }

      return baseHealth;
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
