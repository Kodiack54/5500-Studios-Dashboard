import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const conventionType = searchParams.get('convention_type');

  try {
    let query = db
      .from('dev_ai_conventions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (conventionType) {
      query = query.eq('convention_type', conventionType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      conventions: data || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, convention_type, name, description, example } = body;

    const { data, error } = await db
      .from('dev_ai_conventions')
      .insert({
        project_id,
        convention_type,
        name,
        description,
        example,
        status: 'active',
      })
      .select('*');

    if (error) throw error;

    return NextResponse.json({ success: true, convention: Array.isArray(data) ? data[0] : data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
