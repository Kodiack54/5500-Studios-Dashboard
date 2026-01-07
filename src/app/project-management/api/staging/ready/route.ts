import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * PATCH /api/staging/ready
 * Mark staging items as ready (or not ready) for parent publish
 * ONLY updates metadata.ready_for_publish - nothing else
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, ids, ready } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    if (typeof ready !== 'boolean') {
      return NextResponse.json({ error: 'ready must be a boolean' }, { status: 400 });
    }

    // Batch update using raw SQL with JSONB merge
    // Scoped by project_id AND id to prevent cross-project updates
    const placeholders = ids.map((_, i) => `$${i + 3}`).join(', ');
    const sql = `
      UPDATE dev_ai_smart_extractions
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('ready_for_publish', $1::boolean),
          updated_at = NOW()
      WHERE project_id = $2 AND id IN (${placeholders})
      RETURNING id
    `;
    
    const result = await db.query<{ id: string }>(sql, [ready, project_id, ...ids]);
    const updatedIds = ((result.data as { id: string }[]) || []).map(r => r.id);

    return NextResponse.json({
      success: true,
      updated: updatedIds.length,
      ids: updatedIds,
    });
  } catch (error) {
    console.error('Error in staging ready PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
