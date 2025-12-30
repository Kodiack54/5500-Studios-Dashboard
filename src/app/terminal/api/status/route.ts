import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Call PM2 to get terminal-server-5400 status
    const response = await fetch('http://localhost:5400/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    }).catch(() => null);

    if (response && response.ok) {
      // Server is responding, get PM2 details
      const pm2Status = await getPM2Status();
      return NextResponse.json({
        online: true,
        ...pm2Status
      });
    }

    // Server not responding, check PM2
    const pm2Status = await getPM2Status();
    return NextResponse.json({
      online: false,
      ...pm2Status
    });
  } catch (error) {
    return NextResponse.json({
      online: false,
      error: (error as Error).message
    });
  }
}

async function getPM2Status() {
  try {
    // Use SSH to get PM2 status (runs on server)
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);
    const terminalServer = processes.find((p: any) => p.name === 'terminal-server-5400');

    if (terminalServer) {
      const uptimeMs = terminalServer.pm2_env?.pm_uptime || 0;
      const uptimeSeconds = Math.floor((Date.now() - uptimeMs) / 1000);

      return {
        pid: terminalServer.pid,
        uptime: formatUptime(uptimeSeconds),
        memory: formatMemory(terminalServer.monit?.memory || 0),
        restarts: terminalServer.pm2_env?.restart_time || 0,
        status: terminalServer.pm2_env?.status
      };
    }

    return { pid: null, uptime: null, memory: null, restarts: 0 };
  } catch (err) {
    return { pid: null, uptime: null, memory: null, restarts: 0 };
  }
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatMemory(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}
