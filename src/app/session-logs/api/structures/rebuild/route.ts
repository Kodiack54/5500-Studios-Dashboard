import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function normalizePath(s: string) {
  return s
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .replace(/\/+/g, "/")
    .replace(/^[A-Z]:/, "")
    .replace(/^\/var\/www\/Studio\//, "")
    .replace(/^C:\/Projects\/Studio\//, "")
    .trim();
}

function extractPaths(row: { name: string | null; description: string | null }) {
  const out: string[] = [];
  const candidates = [row.description || "", row.name || ""].filter(Boolean);

  for (const text of candidates) {
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t) continue;

      const looksLikePath =
        t.includes("/") ||
        /\.[a-z0-9]{1,6}$/i.test(t) ||
        /^[a-z0-9_\-]+(\/[a-z0-9_\-\.]+)+$/i.test(t);

      if (!looksLikePath) continue;

      const cleaned = normalizePath(
        t.replace(/^[-*•\d\)\.]+\s*/, "").replace(/^`|`$/g, "")
      );

      if (cleaned && cleaned.length < 500 && cleaned.includes("/")) out.push(cleaned);
    }
  }

  return out;
}

type Node = { name: string; type: "dir" | "file"; children?: Node[] };

function insertNode(root: Node, parts: string[]) {
  let cur = root;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    const isFile = isLast && /\.[a-z0-9]{1,6}$/i.test(part);

    cur.children ||= [];
    let next = cur.children.find((c) => c.name === part);
    if (!next) {
      next = { name: part, type: isLast ? (isFile ? "file" : "dir") : "dir", children: [] };
      cur.children.push(next);
    }
    cur = next;
  }
}

function buildTree(paths: string[]) {
  const root: Node = { name: "/", type: "dir", children: [] };
  const uniq = Array.from(new Set(paths.map(normalizePath))).filter(Boolean);

  for (const p of uniq) {
    const parts = p.split("/").filter(Boolean);
    if (parts.length) insertNode(root, parts);
  }

  return { root, paths: uniq };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get("project_id");
  if (!project_id) return NextResponse.json({ ok: false, error: "project_id required" }, { status: 400 });

  try {
    // Get file structure conventions for this project
    const result = await db.query(`
      SELECT name, description
      FROM dev_ai_conventions
      WHERE project_id = $1
        AND bucket = 'File Structure'
      ORDER BY created_at DESC
      LIMIT 5000
    `, [project_id]);

    const paths: string[] = [];
    const rows = (result.data || []) as { name: string | null; description: string | null }[];
    for (const r of rows) paths.push(...extractPaths(r as { name: string | null; description: string | null }));

    const structure = buildTree(paths);

    // UPSERT one row per project
    await db.query(`
      INSERT INTO dev_ai_structures (project_id, structure, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (project_id)
      DO UPDATE SET structure = EXCLUDED.structure, updated_at = now()
    `, [project_id, JSON.stringify(structure)]);

    return NextResponse.json({ ok: true, project_id, paths: structure.paths.length });
  } catch (error) {
    console.error("Structure rebuild error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
