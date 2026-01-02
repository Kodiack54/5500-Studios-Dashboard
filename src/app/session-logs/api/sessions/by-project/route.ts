// /src/app/session-logs/api/sessions/by-project/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Row = {
  group_key: string;
  project_id: string | null;
  project_slug: string | null;
  team_port: string | null;
  project_name: string | null;
  project_slug_from_projects: string | null;
  sessions: string;
};

const num = (v: any): number => (typeof v === "string" ? parseInt(v, 10) : v ?? 0);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "active";

    const sql = `
      WITH x AS (
        SELECT
          s.project_id,
          s.project_slug,
          s.team_port::text AS team_port,
          COALESCE(
            s.project_id,
            CASE
              WHEN s.project_slug IS NOT NULL AND s.team_port IS NOT NULL
              THEN s.project_slug || ':' || s.team_port::text
              ELSE 'unknown'
            END
          ) AS group_key
        FROM dev_ai_sessions s
        WHERE s.status = $1
      ),
      grouped AS (
        SELECT
          x.group_key,
          x.project_id,
          NULLIF(x.project_slug, '') AS project_slug,
          x.team_port,
          count(*) AS sessions
        FROM x
        GROUP BY x.group_key, x.project_id, x.project_slug, x.team_port
      )
      SELECT
        g.*,
        p.name AS project_name,
        p.slug AS project_slug_from_projects
      FROM grouped g
      LEFT JOIN dev_projects p
        ON (g.project_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
       AND p.id::text = g.project_id
      ORDER BY g.sessions DESC, g.group_key ASC;
    `;

    const result = await db.query<Row>(sql, [status]);
    const rows = (result.data || []) as Row[];

    const groups = rows.map((r) => {
      const teamPortNum = r.team_port ? parseInt(r.team_port, 10) : null;
      const routedLabel =
        r.project_slug && teamPortNum ? `${r.project_slug}-${teamPortNum}` : null;

      const displayName =
        r.project_name || routedLabel || (r.group_key === "unknown" ? "Unknown" : r.group_key);

      const displaySlug =
        r.project_slug_from_projects || routedLabel || r.project_slug || null;

      return {
        group_key: r.group_key,
        project_id: r.project_id,
        project_slug: r.project_slug,
        team_port: teamPortNum,
        display: { name: displayName, slug: displaySlug },
        counts: { sessions: num(r.sessions) },
      };
    });

    return NextResponse.json({ ok: true, groups });
  } catch (err: any) {
    console.error("Sessions by-project error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
