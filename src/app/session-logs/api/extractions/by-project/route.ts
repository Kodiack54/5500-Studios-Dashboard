import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch Susan's Filing (Jen's extractions by project)
// Aggregates child project counts to parent projects
export async function GET() {
  try {
    // Get ALL projects (parents and children)
    const projectsResult = await db.query<{ id: string; name: string; parent_id: string | null; is_parent: boolean }>(
      "SELECT id, name, parent_id, is_parent FROM dev_projects WHERE is_active = true ORDER BY name"
    );
    const allProjects = (projectsResult.data || []) as { id: string; name: string; parent_id: string | null; is_parent: boolean }[];

    // Build parent/child maps
    const parentProjects = allProjects.filter(p => p.is_parent || !p.parent_id);
    const childToParent: Record<string, string> = {};
    
    for (const p of allProjects) {
      if (p.parent_id) {
        childToParent[p.id] = p.parent_id;
      }
    }

    // Initialize counts for parent projects only
    const projectBreakdown: Record<string, {
      name: string;
      todos: number;
      bugs: number;
      knowledge: number;
      structure: number;
      total: number;
    }> = {};

    for (const p of parentProjects) {
      projectBreakdown[p.id] = {
        name: p.name,
        todos: 0,
        bugs: 0,
        knowledge: 0,
        structure: 0,
        total: 0,
      };
    }

    // Helper to add counts - routes child project counts to parent
    const addCount = (projectId: string | null, field: 'todos' | 'bugs' | 'knowledge' | 'structure', count: number) => {
      if (!projectId) {
        // Unknown/null project_id
        if (!projectBreakdown['unknown']) {
          projectBreakdown['unknown'] = { name: '⚠️ Unknown', todos: 0, bugs: 0, knowledge: 0, structure: 0, total: 0 };
        }
        projectBreakdown['unknown'][field] += count;
        projectBreakdown['unknown'].total += count;
        return;
      }

      // Find the parent (or use project itself if it's a parent)
      const targetId = childToParent[projectId] || projectId;
      
      if (!projectBreakdown[targetId]) {
        // Project exists but not in our parent list - might be orphan
        const proj = allProjects.find(p => p.id === targetId);
        projectBreakdown[targetId] = {
          name: proj?.name || '⚠️ Unknown',
          todos: 0, bugs: 0, knowledge: 0, structure: 0, total: 0,
        };
      }
      
      projectBreakdown[targetId][field] += count;
      projectBreakdown[targetId].total += count;
    };

    // TODOS: dev_ai_todos (status = 'unassigned')
    try {
      const result = await db.query<{ project_id: string; count: string }>(
        "SELECT project_id, COUNT(*) as count FROM dev_ai_todos WHERE status = 'unassigned' GROUP BY project_id"
      );
      for (const row of (result.data || []) as { project_id: string; count: string }[]) {
        addCount(row.project_id, 'todos', parseInt(row.count, 10));
      }
    } catch { }

    // BUGS: dev_ai_bugs (status = 'open')
    try {
      const result = await db.query<{ project_id: string; count: string }>(
        "SELECT project_id, COUNT(*) as count FROM dev_ai_bugs WHERE status = 'open' GROUP BY project_id"
      );
      for (const row of (result.data || []) as { project_id: string; count: string }[]) {
        addCount(row.project_id, 'bugs', parseInt(row.count, 10));
      }
    } catch { }

    // KNOWLEDGE: multiple tables with status = 'pending'
    const knowledgeTables = ['dev_ai_knowledge', 'dev_ai_decisions', 'dev_ai_lessons', 'dev_ai_journal', 'dev_ai_snippets', 'dev_ai_docs'];
    for (const table of knowledgeTables) {
      try {
        const result = await db.query<{ project_id: string; count: string }>(
          `SELECT project_id, COUNT(*) as count FROM ${table} WHERE status = 'pending' GROUP BY project_id`
        );
        for (const row of (result.data || []) as { project_id: string; count: string }[]) {
          addCount(row.project_id, 'knowledge', parseInt(row.count, 10));
        }
      } catch { }
    }

    // STRUCTURE: dev_ai_conventions (status = 'active')
    try {
      const result = await db.query<{ project_id: string; count: string }>(
        "SELECT project_id, COUNT(*) as count FROM dev_ai_conventions WHERE status = 'active' GROUP BY project_id"
      );
      for (const row of (result.data || []) as { project_id: string; count: string }[]) {
        addCount(row.project_id, 'structure', parseInt(row.count, 10));
      }
    } catch { }

    // Convert to sorted array
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

    return NextResponse.json({ success: true, projects, totals });
  } catch (error) {
    console.error("Error fetching Susan's project breakdown:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch project breakdown" }, { status: 500 });
  }
}
