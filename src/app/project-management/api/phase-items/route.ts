import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET phase items for a specific phase
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phaseId = searchParams.get('phase_id');

  if (!phaseId) {
    return NextResponse.json(
      { success: false, error: 'phase_id is required' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await db.from('dev_phase_items')
      .select('*')
      .eq('phase_id', phaseId)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      items: data || []
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create a new phase item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phase_id, title, description, sort_order } = body;

    if (!phase_id || !title) {
      return NextResponse.json(
        { success: false, error: 'phase_id and title are required' },
        { status: 400 }
      );
    }

    const { data, error } = await db.from('dev_phase_items')
      .insert({
        phase_id,
        title,
        description: description || null,
        status: 'pending',
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: data
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
