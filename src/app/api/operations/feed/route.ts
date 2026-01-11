/**
 * Operations Live Feed API
 * Reads from dev_ops_events with registry-based filtering
 * Only shows events where action_registry.show_in_feed = TRUE
 */

import { NextResponse } from 'next/server';

const dbConfig = {
  host: process.env.PG_HOST || '161.35.229.220',
  port: parseInt(process.env.PG_PORT || '9432'),
  database: process.env.PG_DATABASE || 'kodiack_ai',
  user: process.env.PG_USER || 'kodiack_admin',
  password: process.env.PG_PASSWORD || 'K0d1ack_Pr0d_2025_Rx9',
};

interface FeedEvent {
  id: string;
  serviceId: string;
  eventType: string;
  message: string;
  timestamp: string;
  traceId?: string;
  details?: Record<string, unknown>;
}

// Event type to human message mapping
function getEventMessage(eventType: string, metadata: Record<string, unknown>): string {
  const traceShort = metadata?.trace_id ? ` [${String(metadata.trace_id).slice(-6)}]` : '';
  const mode = metadata?.mode || 'unknown';
  const project = metadata?.project_name || metadata?.project_slug || metadata?.project_id || null;
  const source = metadata?.source || 'unknown';
  const contextLabel = project ? `${mode} (${project})` : mode;

  switch (eventType) {
    case 'pc_transcript_sent':
    case 'terminal_transcript_sent':
      return `Transcript sent → 9500: ${contextLabel}${traceShort}`;
    case 'transcript_received':
      return `Transcript received from ${source}: ${contextLabel}${traceShort}`;
    case 'pc_heartbeat':
    case 'pc_sender_heartbeat':
    case 'external_claude_heartbeat':
    case 'terminal_heartbeat':
    case 'router_heartbeat':
    case 'dashboard_process_heartbeat':
    case 'context_heartbeat':
      return `Heartbeat: ${contextLabel}`;
    case 'context_flip':
      return `Context flip → ${contextLabel}`;
    default:
      return eventType;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');
  const limit = parseInt(searchParams.get('limit') || '200');
  const serviceFilter = searchParams.get('service');
  const onlyVerbs = searchParams.get('only_verbs'); // Comma-separated for isolation mode
  const includeUnregistered = searchParams.get('include_unregistered') === '1'; // Debug mode

  try {
    const { Pool } = await import('pg');
    const pool = new Pool(dbConfig);

    const sinceTime = since ? new Date(since) : new Date(Date.now() - 30 * 60 * 1000);

    // Query with registry join for show_in_feed filtering
    let query = `
      SELECT e.id, e.timestamp, e.service_id, e.event_type, e.trace_id, e.metadata,
             ar.verb, ar.show_in_feed
      FROM dev_ops_events e
      LEFT JOIN ops.action_registry ar ON ar.action_code = e.metadata->>'action_code'
      WHERE e.timestamp > $1
    `;
    const params: (string | number | string[])[] = [sinceTime.toISOString()];
    let paramIndex = 2;

    // Filter by show_in_feed (unless debug mode)
    if (!includeUnregistered) {
      query += ` AND COALESCE(ar.show_in_feed, FALSE) = TRUE`;
    }

    // Optional service filter
    if (serviceFilter) {
      query += ` AND e.service_id = $${paramIndex}`;
      params.push(serviceFilter);
      paramIndex++;
    }

    // Optional verb isolation mode
    if (onlyVerbs) {
      const verbList = onlyVerbs.split(',').map(v => v.trim().toUpperCase());
      query += ` AND ar.verb = ANY($${paramIndex}::text[])`;
      params.push(verbList);
      paramIndex++;
    }

    query += ` ORDER BY e.timestamp ASC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    const events: FeedEvent[] = result.rows.map(row => ({
      id: row.id,
      serviceId: row.service_id,
      eventType: row.event_type,
      message: getEventMessage(row.event_type, row.metadata || {}),
      timestamp: new Date(row.timestamp).toISOString(),
      traceId: row.trace_id,
      details: row.metadata,
    }));

    await pool.end();

    return NextResponse.json({
      success: true,
      events,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Operations Feed] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message, events: [] },
      { status: 500 }
    );
  }
}
