import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/projects
 * Get all active projects from dev_projects table
 */
export async function GET(request: NextRequest) {
  try {
    const { data: projects, error } = await db
      .from('dev_projects')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, projects: projects || [] });
  } catch (error) {
    console.error('Error in projects GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
