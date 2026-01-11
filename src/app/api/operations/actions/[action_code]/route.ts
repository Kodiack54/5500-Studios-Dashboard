import { NextRequest, NextResponse } from 'next/server';

const OPS_API_URL = process.env.OPS_API_URL || 'http://localhost:9200';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ action_code: string }> }
) {
  try {
    const { action_code } = await params;
    const body = await request.json();

    const res = await fetch(`${OPS_API_URL}/v1/ops/actions/${encodeURIComponent(action_code)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errorData.error || `OPS API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API/actions/PATCH] Failed to update action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update action' },
      { status: 500 }
    );
  }
}
