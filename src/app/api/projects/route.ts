import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/projects
 * Fetch projects - supports parents_only filter for Studio session selection
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const parentsOnly = url.searchParams.get('parents_only') === 'true';

    let query = db.from('dev_projects').select('id, name, slug, server_path, local_path, parent_id, is_parent');

    if (parentsOnly) {
      // Only get parent projects (no parent_id)
      query = query.is('parent_id', null);
    }

    query = query.eq('is_active', true).order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      projects: data || [],
      count: (data || []).length
    });

  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
