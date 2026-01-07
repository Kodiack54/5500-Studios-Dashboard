import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface Worklog {
  id: string;
  ts_id: string;
  mode: string;
  title: string | null;
  briefing: string | null;
  clean_text: string | null;
  segment_start: string;
  segment_end: string;
  window_start: string | null;
  window_end: string | null;
  duration_hours: number;
  status: string;
  created_at: string;
  parent_project_id: string | null;
  metadata: { session_count?: number } | null;
}

/**
 * GET /session-logs/api/[tsId] - Get single worklog by TS ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tsId: string }> }
) {
  try {
    const { tsId } = await params;

    const { data, error } = await db.from('dev_ai_worklogs')
      .select('*')
      .eq('ts_id', tsId)
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        success: false, 
        error: 'Worklog not found' 
      }, { status: 404 });
    }

    const worklog = data as unknown as Worklog;

    // Get project info
    let projectSlug = null;
    let projectName = null;
    
    if (worklog.parent_project_id) {
      const { data: project } = await db.from('dev_projects')
        .select('slug, name')
        .eq('id', worklog.parent_project_id)
        .single();
      if (project) {
        const proj = project as { slug: string; name: string };
        projectSlug = proj.slug;
        projectName = proj.name;
      }
    }

    // Get associated sessions
    const { data: sessions } = await db.from('dev_ai_sessions')
      .select('id, started_at, ended_at, message_count, status')
      .eq('worklog_id', worklog.id)
      .order('started_at', { ascending: true });

    return NextResponse.json({
      success: true,
      worklog: {
        ts_id: worklog.ts_id,
        mode: worklog.mode,
        title: worklog.title,
        briefing: worklog.briefing,
        clean_text: worklog.clean_text,
        segment_start: worklog.segment_start,
        segment_end: worklog.segment_end,
        window_start: worklog.window_start,
        window_end: worklog.window_end,
        duration_hours: worklog.duration_hours,
        status: worklog.status,
        created_at: worklog.created_at,
        project_slug: projectSlug,
        project_name: projectName,
        session_count: worklog.metadata?.session_count || 0,
        sessions: sessions || []
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Worklog detail API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
