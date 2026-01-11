import { NextRequest, NextResponse } from 'next/server';

const OPS_API = process.env.OPS_API_URL || 'http://161.35.229.220:9200';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const primaryOnly = searchParams.get('primary') === '1';

    const url = `${OPS_API}/v1/ops/who${primaryOnly ? '?primary=1' : ''}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[who] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
