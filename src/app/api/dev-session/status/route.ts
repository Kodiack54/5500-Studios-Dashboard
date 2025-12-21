import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface DevSession {
  id: string;
  user_id: string;
  dev_slot: string;
  base_port: number;
  status: string;
  started_at: string;
}

interface UserInfo {
  id: string;
  name: string;
}

/**
 * GET /api/dev-session/status
 * Returns all active dev sessions to show which teams are locked
 */
export async function GET() {
  try {
    // Get all active dev sessions
    const { data: sessions, error: sessionsError } = await db
      .from('dev_sessions')
      .select('*')
      .eq('status', 'active');

    if (sessionsError) {
      console.error('Error fetching dev sessions:', sessionsError);
      // Return empty if table doesn't exist yet
      return NextResponse.json({
        success: true,
        sessions: [],
        lockedTeams: {},
      });
    }

    // Get user info for each session
    const typedSessions = (sessions || []) as unknown as DevSession[];
    const userIds = typedSessions.map(s => s.user_id);

    let userMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: users } = await db
        .from('users')
        .select('id, name')
        .in('id', userIds);

      const typedUsers = (users || []) as unknown as UserInfo[];
      userMap = typedUsers.reduce((acc, u) => {
        acc[u.id] = u.name || 'Unknown User';
        return acc;
      }, {} as Record<string, string>);
    }

    // Build locked teams map: { dev1: { userId, userName, since }, ... }
    const lockedTeams: Record<string, { userId: string; userName: string; since: string }> = {};

    typedSessions.forEach(session => {
      lockedTeams[session.dev_slot] = {
        userId: session.user_id,
        userName: userMap[session.user_id] || 'Unknown User',
        since: session.started_at,
      };
    });

    return NextResponse.json({
      success: true,
      sessions: typedSessions.map(s => ({
        ...s,
        userName: userMap[s.user_id] || 'Unknown User',
      })),
      lockedTeams,
    });

  } catch (error) {
    console.error('Error in dev-session status:', error);
    return NextResponse.json(
      { error: 'Failed to get dev session status' },
      { status: 500 }
    );
  }
}
