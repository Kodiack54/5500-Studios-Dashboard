/**
 * Claude Terminal Status API
 * GET /api/claude/status
 *
 * Check if we're connected to Claude terminal at port 5400
 */

import { NextResponse } from 'next/server';

// Simple in-memory connection state (in production, use Redis or similar)
let isConnected = false;

export async function GET() {
  // Try to ping the Claude terminal at port 5400
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('http://localhost:5400/health', {
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeout);
    isConnected = res?.ok ?? false;
  } catch {
    isConnected = false;
  }

  return NextResponse.json({
    connected: isConnected,
    port: 5400,
  });
}
