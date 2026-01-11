import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '9432'),
  database: process.env.PG_DATABASE || 'kodiack_ai',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get('node_id') || searchParams.get('droplet_id');

  try {
    // Get all droplets from registry with canonical state
    // JOIN on node_id (TEXT) since current_state_droplets uses node_id as droplet_id
    const dropletsRes = await pool.query(`
      SELECT 
        r.droplet_id, r.droplet_name, r.node_id, r.provider, r.region, 
        r.ip_public, r.disk_size, r.ram_size, r.is_active,
        s.cpu_percent, s.memory_used, s.memory_total,
        s.disk_used, s.disk_total, s.disk_percent,
        s.load_1m, s.load_5m, s.load_15m, s.uptime,
        s.pm2_online, s.pm2_stopped, s.last_seen,
        COALESCE(s.status, 'awaiting_sensor') as status
      FROM ops.droplet_registry r
      LEFT JOIN ops.current_state_droplets s ON r.node_id = s.droplet_id
      WHERE r.is_active = true
      ORDER BY r.droplet_name
    `);

    // Get services for selected droplet (use node_id)
    let servicesRes;
    if (nodeId) {
      servicesRes = await pool.query(`
        SELECT pm2_id, name, status, cpu, memory, uptime, restarts, last_seen
        FROM ops.current_state_services
        WHERE droplet_id = $1
        ORDER BY name
      `, [nodeId]);
    } else {
      servicesRes = { rows: [] };
    }

    return NextResponse.json({
      droplets: dropletsRes.rows,
      services: servicesRes.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Droplets API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
