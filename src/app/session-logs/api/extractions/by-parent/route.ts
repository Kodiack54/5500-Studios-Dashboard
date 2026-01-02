// /src/app/session-logs/api/extractions/by-parent/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

const num = (v: any): number => (typeof v === "string" ? parseInt(v, 10) : v ?? 0);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parentId = url.searchParams.get("parent_id");

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
            WHEN t.depth = 0 THEN c.id          -- first level child becomes root_child
            ELSE t.root_child_id                -- deeper levels inherit it
          END AS root_child_id
        FROM dev_projects c
        JOIN tree t ON c.parent_id = t.id
      ),
      parent_info AS (
        SELECT id, name, slug FROM tree WHERE depth = 0
      ),
      -- Every descendant (any depth) mapped to its depth=1 root child
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
      -- Count per extraction table by root_child_id (includes full subtree)
      todos AS (
        SELECT dm.root_child_id, count(*) AS cnt
        FROM dev_ai_todos t
        JOIN desc_map dm ON t.project_id = dm.descendant_id
        GROUP BY dm.root_child_id
      ),
      bugs AS (
        SELECT dm.root_child_id, count(*) AS cnt
        FROM dev_ai_bugs b
        JOIN desc_map dm ON b.project_id = dm.descendant_id
        GROUP BY dm.root_child_id
      ),
      knowledge AS (
        SELECT dm.root_child_id, count(*) AS cnt
        FROM dev_ai_knowledge k
        JOIN desc_map dm ON k.project_id = dm.descendant_id
        GROUP BY dm.root_child_id
      ),
      conventions AS (
        SELECT dm.root_child_id, count(*) AS cnt
        FROM dev_ai_conventions co
        JOIN desc_map dm ON co.project_id = dm.descendant_id
        GROUP BY dm.root_child_id
      ),
      decisions AS (
        SELECT dm.root_child_id, count(*) AS cnt
        FROM dev_ai_decisions d
        JOIN desc_map dm ON d.project_id = dm.descendant_id
        GROUP BY dm.root_child_id
      ),
      lessons AS (
        SELECT dm.root_child_id, count(*) AS cnt
        FROM dev_ai_lessons l
        JOIN desc_map dm ON l.project_id = dm.descendant_id
        GROUP BY dm.root_child_id
      ),
      -- Aggregate by root child (each child = its full subtree)
      child_counts AS (
        SELECT
          c.id AS project_id,
          c.name,
          c.slug,
          COALESCE(t.cnt, 0) AS todos,
          COALESCE(b.cnt, 0) AS bugs,
          COALESCE(k.cnt, 0) AS knowledge,
          COALESCE(co.cnt, 0) AS conventions,
          COALESCE(d.cnt, 0) AS decisions,
          COALESCE(l.cnt, 0) AS lessons
        FROM children_info c
        LEFT JOIN todos t ON t.root_child_id = c.id
        LEFT JOIN bugs b ON b.root_child_id = c.id
        LEFT JOIN knowledge k ON k.root_child_id = c.id
        LEFT JOIN conventions co ON co.root_child_id = c.id
        LEFT JOIN decisions d ON d.root_child_id = c.id
        LEFT JOIN lessons l ON l.root_child_id = c.id
      )
      SELECT
        (SELECT row_to_json(p) FROM parent_info p) AS parent,
        json_agg(
          json_build_object(
            'project_id', cc.project_id,
            'name', cc.name,
            'slug', cc.slug,
            'counts', json_build_object(
              'todos', cc.todos,
              'bugs', cc.bugs,
              'knowledge', cc.knowledge,
              'conventions', cc.conventions,
              'decisions', cc.decisions,
              'lessons', cc.lessons,
              'total', cc.todos + cc.bugs + cc.knowledge + cc.conventions + cc.decisions + cc.lessons
            )
          )
        ) AS children,
        json_build_object(
          'todos', SUM(cc.todos),
          'bugs', SUM(cc.bugs),
          'knowledge', SUM(cc.knowledge),
          'conventions', SUM(cc.conventions),
          'decisions', SUM(cc.decisions),
          'lessons', SUM(cc.lessons),
          'total', SUM(cc.todos + cc.bugs + cc.knowledge + cc.conventions + cc.decisions + cc.lessons)
        ) AS totals
      FROM child_counts cc;
    `;

    const result = await db.query(sql, [parentId]);
    const rows = result.data as any[];
    const row = rows?.[0];

    if (!row || !row.parent) {
      return NextResponse.json({ ok: false, error: "Parent not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      parent: row.parent,
      totals: {
        todos: num(row.totals?.todos),
        bugs: num(row.totals?.bugs),
        knowledge: num(row.totals?.knowledge),
        conventions: num(row.totals?.conventions),
        decisions: num(row.totals?.decisions),
        lessons: num(row.totals?.lessons),
        total: num(row.totals?.total),
      },
      children: (row.children || []).filter((c: any) => c).map((c: any) => ({
        ...c,
        counts: {
          todos: num(c.counts?.todos),
          bugs: num(c.counts?.bugs),
          knowledge: num(c.counts?.knowledge),
          conventions: num(c.counts?.conventions),
          decisions: num(c.counts?.decisions),
          lessons: num(c.counts?.lessons),
          total: num(c.counts?.total),
        },
      })),
    });
  } catch (err: any) {
    console.error("Extractions by-parent error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
