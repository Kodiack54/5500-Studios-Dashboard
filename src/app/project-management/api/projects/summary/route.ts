import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ProjectSummary {
  project_id: string;
  // Working items (waiting for action)
  pending_todos: number;      // unassigned
  pending_bugs: number;       // open
  pending_knowledge: number;  // pending (accumulating for Clair)
  pending_total: number;
  // Completed items (Clair processed)
  done_todos: number;         // completed/closed
  done_bugs: number;          // fixed
  done_knowledge: number;     // published
  done_docs: number;          // published
  done_total: number;
  // Totals per category
  todos: number;
  bugs: number;
  knowledge: number;
  docs: number;
  conventions: number;
  total: number;
}

async function countByProjectAndStatus(table: string, projectId: string, status: string): Promise<number> {
  try {
    const sql = `SELECT COUNT(*) as count FROM ${table} WHERE project_id = $1 AND status = $2`;
    const result = await db.query<{ count: string }>(sql, [projectId, status]);
    return parseInt((result.data as { count: string }[])?.[0]?.count || "0", 10);
  } catch {
    return 0;
  }
}

async function countByProject(table: string, projectId: string, status?: string): Promise<number> {
  try {
    const sql = status
      ? `SELECT COUNT(*) as count FROM ${table} WHERE project_id = $1 AND status = $2`
      : `SELECT COUNT(*) as count FROM ${table} WHERE project_id = $1`;
    const params = status ? [projectId, status] : [projectId];
    const result = await db.query<{ count: string }>(sql, params);
    return parseInt((result.data as { count: string }[])?.[0]?.count || "0", 10);
  } catch {
    return 0;
  }
}

async function getProjectSummary(projectId: string): Promise<ProjectSummary> {
  // Pending counts - items waiting for action
  const [pendingTodos, pendingBugs, pendingKnowledge] = await Promise.all([
    countByProjectAndStatus("dev_ai_todos", projectId, "unassigned"),
    countByProjectAndStatus("dev_ai_bugs", projectId, "open"),
    countByProjectAndStatus("dev_ai_knowledge", projectId, "pending"),
  ]);

  // Done counts - Clair processed items
  const [doneTodosCompleted, doneTodosClosed, doneBugs, doneKnowledge, doneDocs] = await Promise.all([
    countByProjectAndStatus("dev_ai_todos", projectId, "completed"),
    countByProjectAndStatus("dev_ai_todos", projectId, "closed"),
    countByProjectAndStatus("dev_ai_bugs", projectId, "fixed"),
    countByProjectAndStatus("dev_ai_knowledge", projectId, "published"),
    countByProjectAndStatus("dev_ai_docs", projectId, "published"),
  ]);
  const doneTodos = doneTodosCompleted + doneTodosClosed;

  // Total counts - all items in project
  const [todos, bugs, knowledge, docs, conventions] = await Promise.all([
    countByProject("dev_ai_todos", projectId),
    countByProject("dev_ai_bugs", projectId),
    countByProject("dev_ai_knowledge", projectId),
    countByProject("dev_ai_docs", projectId),
    countByProject("dev_ai_conventions", projectId, "active"),
  ]);

  return {
    project_id: projectId,
    pending_todos: pendingTodos,
    pending_bugs: pendingBugs,
    pending_knowledge: pendingKnowledge,
    pending_total: pendingTodos + pendingBugs + pendingKnowledge,
    done_todos: doneTodos,
    done_bugs: doneBugs,
    done_knowledge: doneKnowledge,
    done_docs: doneDocs,
    done_total: doneTodos + doneBugs + doneKnowledge + doneDocs,
    todos,
    bugs,
    knowledge,
    docs,
    conventions,
    total: todos + bugs + knowledge + docs + conventions,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");

    if (projectId) {
      const summary = await getProjectSummary(projectId);
      return NextResponse.json({ success: true, summary });
    }

    const { data: projects } = await db.from("dev_projects")
      .select("id, name, slug, server_path")
      .eq("is_active", true);

    const summaries: Record<string, ProjectSummary> = {};
    for (const project of (projects || []) as Array<Record<string, unknown>>) {
      const pid = String(project.id);
      summaries[pid] = await getProjectSummary(pid);
    }

    return NextResponse.json({ success: true, summaries });
  } catch (error) {
    console.error("Error in projects summary:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
