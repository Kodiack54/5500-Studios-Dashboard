import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    // Get session stats
    const [activeSessions, processedSessions] = await Promise.all([
      supabase.from('dev_ai_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('dev_ai_sessions').select('id', { count: 'exact', head: true }).eq('status', 'processed')
    ]);

    // Get item counts by status for each table
    const tables = ['dev_ai_todos', 'dev_ai_bugs', 'dev_ai_knowledge', 'dev_ai_docs', 'dev_ai_journal'];
    const stats: Record<string, { flagged: number; pending: number; final: number }> = {};
    
    for (const table of tables) {
      const [flagged, pending, final] = await Promise.all([
        supabase.from(table).select('id', { count: 'exact', head: true }).eq('status', 'flagged'),
        supabase.from(table).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from(table).select('id', { count: 'exact', head: true }).in('status', ['open', 'cataloged', 'draft', 'active', 'decided'])
      ]);
      
      const name = table.replace('dev_ai_', '');
      stats[name] = {
        flagged: flagged.count || 0,
        pending: pending.count || 0,
        final: final.count || 0
      };
    }

    // Get recent processing activity (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const [recentTodos, recentBugs, recentKnowledge] = await Promise.all([
      supabase.from('dev_ai_todos').select('id', { count: 'exact', head: true }).gte('created_at', oneHourAgo),
      supabase.from('dev_ai_bugs').select('id', { count: 'exact', head: true }).gte('created_at', oneHourAgo),
      supabase.from('dev_ai_knowledge').select('id', { count: 'exact', head: true }).gte('created_at', oneHourAgo)
    ]);

    return NextResponse.json({
      success: true,
      sessions: {
        active: activeSessions.count || 0,
        processed: processedSessions.count || 0
      },
      items: stats,
      recentActivity: {
        todos: recentTodos.count || 0,
        bugs: recentBugs.count || 0,
        knowledge: recentKnowledge.count || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Pipeline stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
