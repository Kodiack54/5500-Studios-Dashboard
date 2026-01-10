import { NextResponse } from 'next/server';

const OPS_API_URL = process.env.OPS_API_URL || 'http://localhost:9200';

export async function GET() {
  try {
    const res = await fetch(`${OPS_API_URL}/v1/ops/verbs`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!res.ok) {
      throw new Error(`OPS API returned ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API/verbs] Failed to fetch verb registry:', error);
    // Return minimal fallback
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch verb registry',
      byEventType: {},
      verbs: [],
    }, { status: 500 });
  }
}
