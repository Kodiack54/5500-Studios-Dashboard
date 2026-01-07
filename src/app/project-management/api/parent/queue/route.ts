import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/parent/queue?parent_project_id=...
 * Returns ready staging items from all child projects
 * Parent-only: 403 if not a parent project
 */

interface ProjectRow {
  is_parent: boolean | null;
  parent_id: string | null;
}

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentProjectId = searchParams.get('parent_project_id');

    if (!parentProjectId) {
      return NextResponse.json({ error: 'parent_project_id is required' }, { status: 400 });
    }

    // Parent-only guard
    if (!(await assertParentProjectById(parentProjectId))) {
      return NextResponse.json({ error: 'parent-project only' }, { status: 403 });
    }

    // Get all child project IDs for this parent
    const { data: childProjects } = await db
      .from('dev_projects')
      .select('id, name')
      .eq('parent_id', parentProjectId)
      .eq('is_active', true);

    if (!childProjects || childProjects.length === 0) {
      return NextResponse.json({ success: true, items: [], message: 'No child projects found' });
    }

    const typedChildren = childProjects as { id: string; name: string }[];
    const childIds = typedChildren.map(p => p.id);
    const childNameMap: Record<string, string> = {};
    typedChildren.forEach(p => { childNameMap[p.id] = p.name; });

    // Query ready items from children that haven't been promoted to this parent
    // metadata->>'ready_for_publish' = 'true'
    // AND (metadata->>'promoted_to_parent_id' IS NULL OR metadata->>'promoted_to_parent_id' != parentProjectId)
    const placeholders = childIds.map((_, i) => `$${i + 2}`).join(', ');
    const sql = `
      SELECT id, project_id, bucket, status, title, content, priority, 
             session_id as source_session_id, created_at, metadata
      FROM dev_ai_smart_extractions
      WHERE project_id IN (${placeholders})
        AND (metadata->>'ready_for_publish')::boolean = true
        AND (
          metadata->>'promoted_to_parent_id' IS NULL
          OR metadata->>'promoted_to_parent_id' != $1
        )
      ORDER BY created_at DESC
      LIMIT 200
    `;

    const result = await db.query(sql, [parentProjectId, ...childIds]);
    const rows = (result.data || []) as any[];

    // Enrich with child project name
    const items = rows.map(row => ({
      id: row.id,
      child_project_id: row.project_id,
      child_project_name: childNameMap[row.project_id] || 'Unknown',
      bucket: row.bucket,
      status: row.status,
      title: row.title || row.content?.substring(0, 100) || 'Untitled',
      content: row.content,
      priority: row.priority,
      source_session_id: row.source_session_id,
      created_at: row.created_at,
      metadata: row.metadata,
    }));

    return NextResponse.json({
      success: true,
      items,
      child_count: childProjects.length,
    });
  } catch (error) {
    console.error('Error in parent queue GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
