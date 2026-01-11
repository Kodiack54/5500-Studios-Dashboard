import { NextRequest, NextResponse } from 'next/server';

const OPS_API = process.env.OPS_API_URL || 'http://localhost:9200';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ verb: string }> }
) {
  const { verb } = await params;

  try {
    const body = await request.json();

    const res = await fetch(`${OPS_API}/v1/ops/verbs/${encodeURIComponent(verb)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Verb PATCH error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
