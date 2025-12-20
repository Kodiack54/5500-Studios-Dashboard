/**
 * Claude Terminal Connect API
 * POST /api/claude/connect
 *
 * Establish connection to Claude terminal at port 5400
 */

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Attempt to connect to Claude terminal
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('http://localhost:5400/connect', {
      method: 'POST',
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeout);

    if (res?.ok) {
      return NextResponse.json({
        success: true,
        message: 'Connected to Claude terminal',
      });
    }

    // If direct connection fails, try health check
    const healthRes = await fetch('http://localhost:5400/health', {
      signal: AbortSignal.timeout(2000),
    }).catch(() => null);

    if (healthRes?.ok) {
      return NextResponse.json({
        success: true,
        message: 'Claude terminal is available',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Claude terminal not responding on port 5400',
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    });
  }
}
