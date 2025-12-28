import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// The 20 buckets mapped to their destination tables and Jen's status
const BUCKET_TABLE_MAP: Record<string, { table: string; status: string; bucketFilter?: string }> = {
  "Bugs Open": { table: "dev_ai_bugs", status: "open", bucketFilter: "Bugs Open" },
  "Bugs Fixed": { table: "dev_ai_bugs", status: "fixed", bucketFilter: "Bugs Fixed" },
  "Todos": { table: "dev_ai_todos", status: "unassigned" },
  "Journal": { table: "dev_ai_journal", status: "pending", bucketFilter: "Journal" },
  "Work Log": { table: "dev_ai_journal", status: "pending", bucketFilter: "Work Log" },
  "Ideas": { table: "dev_ai_knowledge", status: "pending", bucketFilter: "Ideas" },
  "Decisions": { table: "dev_ai_decisions", status: "pending" },
  "Lessons": { table: "dev_ai_lessons", status: "pending" },
  "System Breakdown": { table: "dev_ai_docs", status: "pending", bucketFilter: "System Breakdown" },
  "How-To Guide": { table: "dev_ai_docs", status: "pending", bucketFilter: "How-To Guide" },
  "Schematic": { table: "dev_ai_docs", status: "pending", bucketFilter: "Schematic" },
  "Reference": { table: "dev_ai_docs", status: "pending", bucketFilter: "Reference" },
  "Naming Conventions": { table: "dev_ai_conventions", status: "active", bucketFilter: "Naming Conventions" },
  "File Structure": { table: "dev_ai_conventions", status: "active", bucketFilter: "File Structure" },
  "Database Patterns": { table: "dev_ai_conventions", status: "active", bucketFilter: "Database Patterns" },
  "API Patterns": { table: "dev_ai_conventions", status: "active", bucketFilter: "API Patterns" },
  "Component Patterns": { table: "dev_ai_conventions", status: "active", bucketFilter: "Component Patterns" },
  "Quirks & Gotchas": { table: "dev_ai_knowledge", status: "pending", bucketFilter: "Quirks & Gotchas" },
  "Snippets": { table: "dev_ai_snippets", status: "pending" },
  "Other": { table: "dev_ai_knowledge", status: "pending", bucketFilter: "Other" },
};

// GET - Fetch extraction bucket counts (Jen's work - rolling 48h window)
// Only count items where the source session is NOT cleaned/archived
export async function GET() {
  try {
    const buckets: Record<string, number> = {};
    let total = 0;

    // Query each bucket - join to sessions, exclude cleaned/archived
    for (const [bucketName, config] of Object.entries(BUCKET_TABLE_MAP)) {
      try {
        let sql = `
          SELECT COUNT(*) as count
          FROM ${config.table} t
          JOIN dev_ai_sessions s ON t.source_session_id = s.id
          WHERE t.status = $1
          AND s.status NOT IN ('cleaned', 'archived')
        `;
        const params: string[] = [config.status];

        if (config.bucketFilter) {
          sql += " AND t.bucket = $2";
          params.push(config.bucketFilter);
        }

        const result = await db.query<{ count: string }>(sql, params);
        const c = parseInt((result.data as { count: string }[])?.[0]?.count || "0", 10);
        buckets[bucketName] = c;
        total += c;
      } catch {
        buckets[bucketName] = 0;
      }
    }

    return NextResponse.json({
      success: true,
      buckets,
      total,
    });
  } catch (error) {
    console.error("Error fetching extraction counts:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch extractions"
    }, { status: 500 });
  }
}
