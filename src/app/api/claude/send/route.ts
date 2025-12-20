/**
 * Claude Terminal Send API
 * POST /api/claude/send
 *
 * Send a command/message to Claude terminal at port 5400
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, waitMs = 5000 } = body;

    if (!command) {
      return NextResponse.json({
        success: false,
        error: 'Command is required',
      }, { status: 400 });
    }

    // Send command to Claude terminal
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), waitMs + 1000);

    const res = await fetch('http://localhost:5400/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, waitMs }),
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeout);

    if (res?.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        response: data.response || data.output || 'Command sent',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to send command to Claude terminal',
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Send failed',
    });
  }
}
