import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/staging/by-ids
 * Fetch staging rows by their IDs (for sources viewer)
 * Body: { ids: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    // Limit to prevent abuse
    if (ids.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 ids allowed' }, { status: 400 });
    }

    // Build parameterized query
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `
      SELECT 
        e.id, 
        e.project_id, 
        e.bucket, 
        e.status, 
        e.title, 
        e.content,
        e.session_id as source_session_id, 
        e.created_at,
        p.name as project_name,
        p.slug as project_slug
      FROM dev_ai_smart_extractions e
      LEFT JOIN dev_projects p ON e.project_id = p.id
      WHERE e.id IN (${placeholders})
      ORDER BY e.created_at DESC
    `;

    const result = await db.query<{
      id: string;
      project_id: string;
      bucket: string;
      status: string;
      title: string;
      content: string;
      source_session_id: string | null;
      created_at: string;
      project_name: string | null;
      project_slug: string | null;
    }>(sql, ids);

    return NextResponse.json({
      success: true,
      items: result.data || [],
    });
  } catch (error) {
    console.error('Error in staging/by-ids POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
