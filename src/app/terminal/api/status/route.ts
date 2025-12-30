import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get PM2 status directly - this is the source of truth
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);
    const terminalServer = processes.find((p: any) => p.name === 'terminal-server-5400');

    if (terminalServer) {
      const isOnline = terminalServer.pm2_env?.status === 'online';
      const uptimeMs = terminalServer.pm2_env?.pm_uptime || 0;
      const uptimeSeconds = isOnline ? Math.floor((Date.now() - uptimeMs) / 1000) : 0;

      return NextResponse.json({
        online: isOnline,
        pid: terminalServer.pid || null,
        uptime: isOnline ? formatUptime(uptimeSeconds) : null,
        memory: formatMemory(terminalServer.monit?.memory || 0),
        restarts: terminalServer.pm2_env?.restart_time || 0,
        status: terminalServer.pm2_env?.status
      });
    }

    return NextResponse.json({
      online: false,
      pid: null,
      uptime: null,
      memory: null,
      restarts: 0,
      status: 'not found'
    });
  } catch (error) {
    return NextResponse.json({
      online: false,
      error: (error as Error).message
    });
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
