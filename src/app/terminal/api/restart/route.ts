import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Restart terminal-server-5400 via PM2
    const { stdout, stderr } = await execAsync('pm2 restart terminal-server-5400');

    // Wait a moment for it to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the new status
    const { stdout: statusOut } = await execAsync('pm2 jlist');
    const processes = JSON.parse(statusOut);
    const terminalServer = processes.find((p: any) => p.name === 'terminal-server-5400');

    return NextResponse.json({
      success: true,
      message: 'Terminal server restarted',
      pid: terminalServer?.pid || null,
      status: terminalServer?.pm2_env?.status || 'unknown'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
