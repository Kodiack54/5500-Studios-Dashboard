/**
 * Claude Terminal Output API
 * GET /api/claude/output
 *
 * Get recent output from Claude terminal at port 5400
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lines = searchParams.get('lines') || '50';

    // Get output from Claude terminal
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`http://localhost:5400/output?lines=${lines}`, {
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeout);

    if (res?.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        output: data.output || data.buffer || '',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to get output from Claude terminal',
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Output fetch failed',
    });
  }
}
