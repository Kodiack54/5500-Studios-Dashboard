import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Published Documents API - Parent-only publishing
 * 403 if project is not a parent
 */

/**
 * DB-backed parent check (different from UI helper in types.ts)
 * Returns true if project is a parent, false otherwise
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

/**
 * GET /api/publish?project_id=xxx
 * Fetch published documents for a parent project
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    // Parent-only guard
    if (!(await assertParentProjectById(projectId))) {
      return NextResponse.json({ error: 'parent-project only' }, { status: 403 });
    }

    // TODO: Fetch published documents from dev_ai_docs where status='published'
    return NextResponse.json({ 
      success: true, 
      documents: [],
      message: 'Published docs feature coming soon - Clair will promote staging docs here'
    });
  } catch (error) {
    console.error('Error in publish GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/publish
 * Publish a document (parent-only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    // Parent-only guard
    if (!(await assertParentProjectById(project_id))) {
      return NextResponse.json({ error: 'parent-project only' }, { status: 403 });
    }

    // TODO: Promote document from staging to published
    return NextResponse.json({ 
      error: 'Not implemented - Clair will handle document promotion' 
    }, { status: 501 });
  } catch (error) {
    console.error('Error in publish POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
