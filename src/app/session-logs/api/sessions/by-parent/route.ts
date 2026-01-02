// /src/app/session-logs/api/sessions/by-parent/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const num = (v: any): number => (typeof v === "string" ? parseInt(v, 10) : v ?? 0);
const UUID_REGEX = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parentId = url.searchParams.get("parent_id");
    const status = url.searchParams.get("status"); // optional filter

    if (!parentId) {
      return NextResponse.json({ ok: false, error: "parent_id required" }, { status: 400 });
    }

    const sql = `
      WITH RECURSIVE tree AS (
        -- Start at parent
        SELECT
          p.id,
          p.parent_id,
          p.name,
          p.slug,
          0 AS depth,
          NULL::uuid AS root_child_id
        FROM dev_projects p
        WHERE p.id = $1

        UNION ALL

        SELECT
          c.id,
          c.parent_id,
          c.name,
          c.slug,
          t.depth + 1 AS depth,
          CASE
            WHEN t.depth = 0 THEN c.id
            ELSE t.root_child_id
          END AS root_child_id
        FROM dev_projects c
        JOIN tree t ON c.parent_id = t.id
      ),
      parent_info AS (
        SELECT id, name, slug FROM tree WHERE depth = 0
      ),
      desc_map AS (
        SELECT
          root_child_id,
          id AS descendant_id
        FROM tree
        WHERE depth > 0
      ),
      children_info AS (
        SELECT id, name, slug
        FROM tree
        WHERE depth = 1
      ),
      -- Count sessions by root_child_id and status (full subtree)
      session_counts AS (
        SELECT
          dm.root_child_id,
          s.status,
          count(*) AS cnt
        FROM dev_ai_sessions s
        JOIN desc_map dm
          ON (s.project_id ~* '${UUID_REGEX}')
         AND (s.project_id::uuid = dm.descendant_id)
        WHERE ($2::text IS NULL OR s.status = $2)
        GROUP BY dm.root_child_id, s.status
      ),
      -- Pivot by root child
      child_sessions AS (
        SELECT
          c.id AS project_id,
          c.name,
          c.slug,
          COALESCE(SUM(sc.cnt) FILTER (WHERE sc.status = 'active'), 0) AS active,
          COALESCE(SUM(sc.cnt) FILTER (WHERE sc.status = 'processed'), 0) AS processed,
          COALESCE(SUM(sc.cnt) FILTER (WHERE sc.status = 'extracted'), 0) AS extracted,
          COALESCE(SUM(sc.cnt) FILTER (WHERE sc.status = 'cleaned'), 0) AS cleaned,
          COALESCE(SUM(sc.cnt) FILTER (WHERE sc.status = 'archived'), 0) AS archived,
          COALESCE(SUM(sc.cnt), 0) AS total
        FROM children_info c
        LEFT JOIN session_counts sc ON sc.root_child_id = c.id
        GROUP BY c.id, c.name, c.slug
      )
      SELECT
        (SELECT row_to_json(p) FROM parent_info p) AS parent,
        json_agg(
          json_build_object(
            'project_id', cs.project_id,
            'name', cs.name,
            'slug', cs.slug,
            'counts', json_build_object(
              'active', cs.active,
              'processed', cs.processed,
              'extracted', cs.extracted,
              'cleaned', cs.cleaned,
              'archived', cs.archived,
              'total', cs.total
            )
          )
        ) AS children,
        json_build_object(
          'active', SUM(cs.active),
          'processed', SUM(cs.processed),
          'extracted', SUM(cs.extracted),
          'cleaned', SUM(cs.cleaned),
          'archived', SUM(cs.archived),
          'total', SUM(cs.total)
        ) AS totals
      FROM child_sessions cs;
    `;

    const result = await db.query(sql, [parentId, status || null]);
    const rows = result.data as any[];
    const row = rows?.[0];

    if (!row || !row.parent) {
      return NextResponse.json({ ok: false, error: "Parent not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      parent: row.parent,
      totals: {
        active: num(row.totals?.active),
        processed: num(row.totals?.processed),
        extracted: num(row.totals?.extracted),
        cleaned: num(row.totals?.cleaned),
        archived: num(row.totals?.archived),
        total: num(row.totals?.total),
      },
      children: (row.children || []).filter((c: any) => c).map((c: any) => ({
        ...c,
        counts: {
          active: num(c.counts?.active),
          processed: num(c.counts?.processed),
          extracted: num(c.counts?.extracted),
          cleaned: num(c.counts?.cleaned),
          archived: num(c.counts?.archived),
          total: num(c.counts?.total),
        },
      })),
    });
  } catch (err: any) {
    console.error("Sessions by-parent error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
