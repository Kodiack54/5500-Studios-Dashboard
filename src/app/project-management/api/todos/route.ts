import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/todos
 * Fetch todos for a project by project_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    let query = db
      .from('dev_ai_todos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: todos, error } = await query;

    if (error) {
      console.error('Error fetching todos:', error);
      return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      todos: todos || [],
    });
  } catch (error) {
    console.error('Error in todos GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/todos
 * Create a new todo item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, title, description, priority, status: todoStatus, session_id } = body;

    if (!project_id || !title) {
      return NextResponse.json({ error: 'project_id and title are required' }, { status: 400 });
    }

    const { data: todo, error } = await db
      .from('dev_ai_todos')
      .insert({
        project_id,
        title,
        description: description || null,
        priority: priority || 'medium',
        status: todoStatus || 'pending',
        source_session_id: session_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting todo:', error);
      return NextResponse.json({ error: 'Failed to save todo' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      todo,
    });
  } catch (error) {
    console.error('Error in todos POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/todos
 * Update a todo item status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status: todoStatus, priority } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, string> = {};
    if (todoStatus) updates.status = todoStatus;
    if (priority) updates.priority = priority;

    const { data: todo, error } = await db
      .from('dev_ai_todos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating todo:', error);
      return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      todo,
    });
  } catch (error) {
    console.error('Error in todos PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/todos
 * Delete a todo item
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await db
      .from('dev_ai_todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
      return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in todos DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
