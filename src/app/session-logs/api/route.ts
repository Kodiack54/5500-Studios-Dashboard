import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /session-logs/api - Session Log Library
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const projectId = searchParams.get('project');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build base query
    let query = db.from('dev_ai_worklogs')
      .select('ts_id, mode, briefing, segment_start, segment_end, window_start, window_end, duration_hours, status, created_at, parent_project_id, metadata')
      ;

    if (mode) query = query.eq('mode', mode);
    if (projectId) query = query.eq('parent_project_id', projectId);

    // Execute with order and limit
    const { data, error } = await query
      .order('segment_start', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Worklogs API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []) as Record<string, unknown>[];

    // Get project info for each worklog
    const worklogs = await Promise.all(rows.map(async (worklog) => {
      let projectSlug = null;
      let projectName = null;
      
      if (worklog.parent_project_id) {
        const { data: project } = await db.from('dev_projects')
          .select('slug, name')
          .eq('id', worklog.parent_project_id as string)
          .single();
        if (project) {
          const p = project as unknown as { slug: string; name: string };
          projectSlug = p.slug;
          projectName = p.name;
        }
      }

      const meta = worklog.metadata as Record<string, number> | null;

      return {
        ts_id: worklog.ts_id,
        mode: worklog.mode,
        briefing: worklog.briefing,
        segment_start: worklog.segment_start,
        segment_end: worklog.segment_end,
        window_start: worklog.window_start,
        window_end: worklog.window_end,
        duration_hours: worklog.duration_hours,
        status: worklog.status,
        created_at: worklog.created_at,
        project_slug: projectSlug,
        project_name: projectName,
        session_count: meta?.session_count || 0
      };
    }));

    return NextResponse.json({
      success: true,
      worklogs,
      pagination: {
        total: worklogs.length,
        limit,
        hasMore: worklogs.length >= limit
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Worklogs API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
