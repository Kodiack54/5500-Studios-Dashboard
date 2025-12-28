import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch Susan's Filing (Jen's extractions by project)
// 4 types: Todos, Bugs, Knowledge, Structure
// - Todos: dev_ai_todos (unassigned)
// - Bugs: dev_ai_bugs (open)
// - Knowledge: dev_ai_knowledge, dev_ai_decisions, dev_ai_lessons, dev_ai_journal (pending)
// - Structure: dev_ai_conventions, dev_ai_snippets, dev_ai_docs (active/pending)
export async function GET() {
  try {
    const projectBreakdown: Record<string, {
      name: string;
      todos: number;
      bugs: number;
      knowledge: number;
      structure: number;
      total: number;
    }> = {};

    // Get all parent projects (where parent_id is null)
    const parentProjectsResult = await db.query<{ id: string; name: string }>(
      "SELECT id, name FROM dev_projects WHERE parent_id IS NULL ORDER BY name"
    );

    if (parentProjectsResult.data && Array.isArray(parentProjectsResult.data)) {
      for (const p of parentProjectsResult.data as { id: string; name: string }[]) {
        projectBreakdown[p.id] = {
          name: p.name,
          todos: 0,
          bugs: 0,
          knowledge: 0,
          structure: 0,
          total: 0,
        };
      }
    }

    // Helper to add counts - creates 'unknown' entry if needed
    const addCount = (key: string | null, field: 'todos' | 'bugs' | 'knowledge' | 'structure', count: number) => {
      const projectKey = key || 'unknown';
      if (!projectBreakdown[projectKey]) {
        projectBreakdown[projectKey] = {
          name: projectKey === 'unknown' ? '⚠️ Unknown' : projectKey,
          todos: 0,
          bugs: 0,
          knowledge: 0,
          structure: 0,
          total: 0,
        };
      }
      projectBreakdown[projectKey][field] += count;
      projectBreakdown[projectKey].total += count;
    };

    // TODOS: dev_ai_todos (status = 'unassigned')
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_todos
        WHERE status = 'unassigned' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'todos', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // BUGS: dev_ai_bugs (status = 'open')
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_bugs
        WHERE status = 'open' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'bugs', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // KNOWLEDGE: dev_ai_knowledge (pending)
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_knowledge
        WHERE status = 'pending' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // KNOWLEDGE: dev_ai_decisions (pending)
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_decisions
        WHERE status = 'pending' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // KNOWLEDGE: dev_ai_lessons (pending)
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_lessons
        WHERE status = 'pending' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // KNOWLEDGE: dev_ai_journal (pending)
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_journal
        WHERE status = 'pending' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // KNOWLEDGE: dev_ai_snippets (pending) - for making documents
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_snippets
        WHERE status = 'pending' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // KNOWLEDGE: dev_ai_docs (pending) - System Breakdown, How-To Guide, Schematic, Reference
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_docs
        WHERE status = 'pending' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // STRUCTURE: dev_ai_conventions (active) - pass-through patterns only
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_conventions
        WHERE status = 'active' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'structure', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // Convert to array - projects with items first, then empty projects
    const withItems = Object.entries(projectBreakdown)
      .filter(([, data]) => data.total > 0)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total);

    const withoutItems = Object.entries(projectBreakdown)
      .filter(([, data]) => data.total === 0)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const projects = [...withItems, ...withoutItems];

    const totals = {
      todos: projects.reduce((sum, p) => sum + p.todos, 0),
      bugs: projects.reduce((sum, p) => sum + p.bugs, 0),
      knowledge: projects.reduce((sum, p) => sum + p.knowledge, 0),
      structure: projects.reduce((sum, p) => sum + p.structure, 0),
      total: projects.reduce((sum, p) => sum + p.total, 0),
    };

    return NextResponse.json({
      success: true,
      projects,
      totals,
    });
  } catch (error) {
    console.error("Error fetching Susan's project breakdown:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch project breakdown"
    }, { status: 500 });
  }
}
