import { NextRequest, NextResponse } from 'next/server';

// AI Droplet where workers run
const AI_DROPLET = process.env.AI_DROPLET_URL || 'http://161.35.229.220';

// AI Team worker definitions
const AI_WORKERS = [
  { id: 'chad', name: 'chad-5401', port: 5401 },
  { id: 'jen', name: 'jen-5402', port: 5402 },
  { id: 'susan', name: 'susan-5403', port: 5403 },
  { id: 'clair', name: 'clair-5404', port: 5404 },
  { id: 'mike', name: 'mike-5405', port: 5405 },
  { id: 'tiffany', name: 'tiffany-5406', port: 5406 },
  { id: 'ryan', name: 'ryan-5407', port: 5407 },
  { id: 'terminal', name: 'terminal-server-5400', port: 5400 },
  { id: 'dashboard', name: 'kodiack-dashboard-5500', port: 5500 },
];

interface WorkerStatus {
  id: string;
  status: 'online' | 'offline' | 'stuck' | 'error';
  uptime?: number;
  lastHeartbeat?: string;
  cpu?: number;
  memory?: number;
  responseTime?: number;
}

// Simple in-memory cache for status (prevents flicker on transient failures)
const statusCache: Record<string, { status: WorkerStatus; timestamp: number }> = {};
const CACHE_TTL = 30000; // 30 seconds - keep last known status for this long

// Check individual worker health with retry logic
async function checkWorkerHealth(worker: typeof AI_WORKERS[0]): Promise<WorkerStatus> {
  // Dashboard is always online - we're serving this request from it!
  if (worker.id === 'dashboard') {
    return {
      id: worker.id,
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
    };
  }

  const startTime = Date.now();
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${AI_DROPLET}:${worker.port}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(4000),  // 4s per attempt
        cache: 'no-store',
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const result: WorkerStatus = {
          id: worker.id,
          status: 'online',
          responseTime,
          uptime: data.uptime,
          cpu: data.cpu,
          memory: data.memory,
          lastHeartbeat: new Date().toISOString(),
        };
        // Cache successful result
        statusCache[worker.id] = { status: result, timestamp: Date.now() };
        return result;
      } else {
        // Non-200 response - don't retry, it's an error
        const result: WorkerStatus = {
          id: worker.id,
          status: 'error',
          responseTime,
        };
        statusCache[worker.id] = { status: result, timestamp: Date.now() };
        return result;
      }
    } catch (error) {
      // If this isn't the last attempt, retry
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
        continue;
      }

      // All retries failed - check cache for recent known-good status
      const cached = statusCache[worker.id];
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        // Return cached status but mark it as potentially stale
        return {
          ...cached.status,
          lastHeartbeat: cached.status.lastHeartbeat, // Keep original heartbeat time
        };
      }

      // No cache or expired - worker is truly offline
      return {
        id: worker.id,
        status: 'offline',
      };
    }
  }

  // Fallback (shouldn't reach here)
  return { id: worker.id, status: 'offline' };
}

export async function GET(request: NextRequest) {
  try {
    // Check all workers in parallel
    const workerStatuses = await Promise.all(
      AI_WORKERS.map(worker => checkWorkerHealth(worker))
    );

    return NextResponse.json({
      success: true,
      workers: workerStatuses,
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Team status check failed:', error);
    return NextResponse.json(
      { success: false, error: 'Status check failed' },
      { status: 500 }
    );
  }
}
