import { NextRequest, NextResponse } from 'next/server';

const OPS_API_URL = process.env.OPS_API_URL || 'http://localhost:9200';

export async function GET() {
  try {
    const res = await fetch(`${OPS_API_URL}/v1/ops/actions`, {
      next: { revalidate: 10 }, // Cache for 10 seconds
    });

    if (!res.ok) {
      throw new Error(`OPS API returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API/actions] Failed to fetch actions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch actions',
      actions: [],
      counts: { total: 0, untracked: 0, unmapped: 0, tracked: 0, show_in_feed: 0 }
    }, { status: 500 });
  }
}
