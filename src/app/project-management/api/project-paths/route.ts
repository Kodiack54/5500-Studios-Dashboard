import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface Project {
  id: string;
  name: string;
  slug: string;
  server_path?: string;
}

/**
 * GET /api/project-paths
 * Returns project itself as the single "path" (for backwards compatibility)
 * The dev_project_paths table no longer exists - we use UUIDs directly
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    // Get project info
    const { data, error } = await db
      .from('dev_projects')
      .select('id, name, slug, server_path')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json({ success: true, paths: [] });
    }

    const project = data as Project | null;

    // Return project as a single path entry for backwards compatibility
    const paths = project ? [{
      id: project.id,
      project_id: project.id,
      path: project.id,  // Use UUID as the path
      label: project.name || project.slug,
      sort_order: 0,
      created_at: new Date().toISOString(),
    }] : [];

    return NextResponse.json({
      success: true,
      paths,
    });
  } catch (error) {
    console.error('Error in project-paths GET:', error);
    return NextResponse.json({ success: true, paths: [] });
  }
}

// Other methods are no-ops since we don't have project_paths table
export async function POST() {
  return NextResponse.json({ success: false, error: 'project_paths table no longer exists' }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: 'project_paths table no longer exists' }, { status: 501 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, error: 'project_paths table no longer exists' }, { status: 501 });
}
