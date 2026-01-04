import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Map Clair endpoints to smart_extractions buckets
const ENDPOINT_TO_BUCKETS: Record<string, string[]> = {
  bugs: ['Bugs Open'],
  bug: ['Bugs Open'],
  todos: ['Todos'],
  todo: ['Todos'],
  journal: ['Work Log', 'Journal'],
  knowledge: ['Context Frame', 'Lessons', 'System Breakdown', 'Ideas'],
  decisions: ['Decisions'],
  lessons: ['Lessons'],
  conventions: ['Conventions'],
  snippets: ['Snippets'],
  docs: ['Docs'],
  doc: ['Docs'],
};

// Pre-Clair active statuses (not rejected, not flagged)
const ACTIVE_STATUSES = ['pending', 'unassigned', 'open'];

function groupByType(data: Array<Record<string, unknown>>, endpoint: string): Record<string, Array<Record<string, unknown>>> {
  const grouped: Record<string, Array<Record<string, unknown>>> = {};
  // Use bucket as grouping key for smart_extractions
  for (const item of data) {
    const key = (item.bucket as string) || (item.category as string) || 'other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  return grouped;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const [endpoint, projectId] = path;
  const buckets = ENDPOINT_TO_BUCKETS[endpoint];

  if (!buckets) {
    return NextResponse.json({ success: false, error: 'Unknown endpoint' }, { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const status = url.searchParams.get('status');

    // Query dev_ai_smart_extractions with bucket filter
    let query = db.from('dev_ai_smart_extractions').select('*');

    // Filter by buckets
    query = query.in('bucket', buckets);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    } else {
      // Show only active statuses (pending, unassigned, open)
      query = query.in('status', ACTIVE_STATUSES);
    }

    query = query.order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const responseKey = endpoint.endsWith('s') ? endpoint : endpoint + 's';
    return NextResponse.json({
      success: true,
      [responseKey]: Array.isArray(data) ? data : [],
      entries: Array.isArray(data) ? data : [],
      count: (Array.isArray(data) ? data : []).length,
      grouped: groupByType(Array.isArray(data) ? data : [], endpoint),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const [endpoint, projectId] = path;
  const buckets = ENDPOINT_TO_BUCKETS[endpoint];

  if (!buckets) {
    return NextResponse.json({ success: false, error: 'Unknown endpoint' }, { status: 400 });
  }

  try {
    const body = await request.json();
    body.project_id = projectId;
    body.bucket = buckets[0]; // Use first bucket as default
    body.created_at = new Date().toISOString();
    body.updated_at = new Date().toISOString();

    const { data, error } = await db.from('dev_ai_smart_extractions').insert(body).select();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const [endpoint, ...rest] = path;
  const id = rest[rest.length - 1];
  const buckets = ENDPOINT_TO_BUCKETS[endpoint];

  if (!buckets) {
    return NextResponse.json({ success: false, error: 'Unknown endpoint' }, { status: 400 });
  }

  try {
    const body = await request.json();
    body.updated_at = new Date().toISOString();
    const { error } = await db.from('dev_ai_smart_extractions').update(body).eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const [endpoint, ...rest] = path;
  const id = rest[rest.length - 1];
  const buckets = ENDPOINT_TO_BUCKETS[endpoint];

  if (!buckets) {
    return NextResponse.json({ success: false, error: 'Unknown endpoint' }, { status: 400 });
  }

  try {
    const { error } = await db.from('dev_ai_smart_extractions').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
