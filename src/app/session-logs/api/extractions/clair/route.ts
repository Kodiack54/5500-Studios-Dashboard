import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch Clair's project breakdown
// Each project shows: Todos (assigned), Bugs (open), Knowledge (published), Structure (published)
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

    // TODOS: dev_ai_todos (status = 'assigned')
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_todos
        WHERE status = 'assigned' GROUP BY project_id
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

    // KNOWLEDGE: dev_ai_knowledge (published)
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_knowledge
        WHERE status = 'published' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // KNOWLEDGE: dev_ai_decisions (published)
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_decisions
        WHERE status = 'published' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // KNOWLEDGE: dev_ai_lessons (published)
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_lessons
        WHERE status = 'published' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // KNOWLEDGE: dev_ai_journal (published)
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_journal
        WHERE status = 'published' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // KNOWLEDGE: dev_ai_snippets (published) - for making documents
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_snippets
        WHERE status = 'published' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // KNOWLEDGE: dev_ai_docs (published) - System Breakdown, How-To Guide, Schematic, Reference
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_docs
        WHERE status = 'published' GROUP BY project_id
      `);
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      }
    } catch { /* table might not exist */ }

    // STRUCTURE: dev_ai_conventions (published) - pass-through patterns only
    try {
      const result = await db.query<{ project_id: string; count: string }>(`
        SELECT project_id, COUNT(*) as count FROM dev_ai_conventions
        WHERE status = 'published' GROUP BY project_id
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
    console.error("Error fetching Clair's data:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch Clair's data"
    }, { status: 500 });
  }
}
