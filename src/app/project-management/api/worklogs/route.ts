import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /project-management/api/worklogs
 * Fetch worklog blocks for a project
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const projectSlug = searchParams.get('project_slug');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!projectId && !projectSlug) {
      return NextResponse.json({ error: 'project_id or project_slug required' }, { status: 400 });
    }

    // Build query
    let query = db
      .from('dev_worklog_blocks')
      .select(`
        id,
        project_id,
        project_slug,
        lane,
        pc_tag,
        window_start,
        window_end,
        message_count,
        bytes_raw,
        bytes_clean,
        raw_text,
        clean_text_worklog,
        created_at,
        cleaned_at
      `)
      .order('window_start', { ascending: false })
      .limit(limit);

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else if (projectSlug) {
      query = query.eq('project_slug', projectSlug);
    }

    const { data: worklogs, error } = await query;

    if (error) {
      console.error('Error fetching worklogs:', error);
      return NextResponse.json({ error: 'Failed to fetch worklogs' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      worklogs: worklogs || [],
      count: worklogs?.length || 0,
    });
  } catch (error) {
    console.error('Error in worklogs GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
