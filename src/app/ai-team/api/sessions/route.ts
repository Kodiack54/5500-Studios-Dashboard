import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch AI sessions with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const workspace = searchParams.get('workspace');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = db.from('dev_ai_sessions')
      .select('id, started_at, ended_at, message_count, last_message_at, terminal_port, user_name, project_id, source_type, source_name, summary, key_topics, files_modified, status, processed_by, processed_at, items_extracted, conflicts_found, workspace, created_at')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (workspace) {
      query = query.eq('workspace', workspace);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching AI sessions:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch from database'
      }, { status: 500 });
    }

    const sessions = Array.isArray(data) ? data : [];

    return NextResponse.json({
      success: true,
      sessions,
      total: count || sessions.length,
      limit,
      offset: 0,
    });
  } catch (error) {
    console.error('Error fetching AI sessions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sessions'
    }, { status: 500 });
  }
}
