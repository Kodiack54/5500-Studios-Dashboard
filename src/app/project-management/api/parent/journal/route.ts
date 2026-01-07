import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ProjectRow {
  is_parent: boolean | null;
  parent_id: string | null;
}

/**
 * Check if project is a parent project (DB-backed)
 */
async function assertParentProjectById(projectId: string): Promise<boolean> {
  const { data } = await db
    .from('dev_projects')
    .select('is_parent, parent_id')
    .eq('id', projectId)
    .single();
  
  const project = data as ProjectRow | null;
  if (!project) return false;
  if (project.is_parent !== undefined && project.is_parent !== null) {
    return project.is_parent === true;
  }
  return project.parent_id == null;
}

/**
 * GET /api/parent/journal
 * Fetch journal entry for a parent project on a specific date
 * Query params: parent_project_id, entry_date (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentProjectId = searchParams.get('parent_project_id');
    const entryDate = searchParams.get('entry_date');

    if (!parentProjectId) {
      return NextResponse.json({ error: 'parent_project_id is required' }, { status: 400 });
    }

    // Parent-only guard
    if (!(await assertParentProjectById(parentProjectId))) {
      return NextResponse.json({ error: 'parent-project only' }, { status: 403 });
    }

    // Default to today if no date provided
    const targetDate = entryDate || new Date().toISOString().split('T')[0];

    // Query journal entry: bucket='Journal', metadata.entry_date matches
    const sql = `
      SELECT id, project_id, bucket, status, title, content, priority,
             session_id as source_session_id, created_at, updated_at, metadata
      FROM dev_ai_smart_extractions
      WHERE project_id = $1
        AND bucket = 'Journal'
        AND metadata->>'entry_date' = $2
      LIMIT 1
    `;

    const result = await db.query<{
      id: string;
      project_id: string;
      bucket: string;
      status: string;
      title: string;
      content: string;
      priority: string;
      source_session_id: string | null;
      created_at: string;
      updated_at: string;
      metadata: Record<string, unknown>;
    }>(sql, [parentProjectId, targetDate]);

    const rows = result.data as unknown[];
    const entry = rows?.[0] || null;

    return NextResponse.json({
      success: true,
      entry,
      entry_date: targetDate,
    });
  } catch (error) {
    console.error('Error in parent/journal GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
