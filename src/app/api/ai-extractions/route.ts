import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// The 20 buckets mapped to their destination tables
const BUCKET_TABLE_MAP: Record<string, { table: string; bucketFilter?: string }> = {
  "Bugs Open": { table: "dev_ai_bugs", bucketFilter: "Bugs Open" },
  "Bugs Fixed": { table: "dev_ai_bugs", bucketFilter: "Bugs Fixed" },
  "Todos": { table: "dev_ai_todos" },
  "Journal": { table: "dev_ai_journal", bucketFilter: "Journal" },
  "Work Log": { table: "dev_ai_journal", bucketFilter: "Work Log" },
  "Ideas": { table: "dev_ai_knowledge", bucketFilter: "Ideas" },
  "Decisions": { table: "dev_ai_decisions" },
  "Lessons": { table: "dev_ai_lessons" },
  "System Breakdown": { table: "dev_ai_docs", bucketFilter: "System Breakdown" },
  "How-To Guide": { table: "dev_ai_docs", bucketFilter: "How-To Guide" },
  "Schematic": { table: "dev_ai_docs", bucketFilter: "Schematic" },
  "Reference": { table: "dev_ai_docs", bucketFilter: "Reference" },
  "Naming Conventions": { table: "dev_ai_conventions", bucketFilter: "Naming Conventions" },
  "File Structure": { table: "dev_ai_conventions", bucketFilter: "File Structure" },
  "Database Patterns": { table: "dev_ai_conventions", bucketFilter: "Database Patterns" },
  "API Patterns": { table: "dev_ai_conventions", bucketFilter: "API Patterns" },
  "Component Patterns": { table: "dev_ai_conventions", bucketFilter: "Component Patterns" },
  "Quirks & Gotchas": { table: "dev_ai_knowledge", bucketFilter: "Quirks & Gotchas" },
  "Snippets": { table: "dev_ai_snippets" },
  "Other": { table: "dev_ai_knowledge", bucketFilter: "Other" },
};

// GET - Fetch FLAGGED extraction bucket counts (Jen's work waiting for Susan)
export async function GET() {
  try {
    const buckets: Record<string, number> = {};
    let totalFlagged = 0;

    // Query each bucket - only count FLAGGED items using raw SQL
    for (const [bucketName, config] of Object.entries(BUCKET_TABLE_MAP)) {
      try {
        let sql = `SELECT COUNT(*) as count FROM ${config.table} WHERE status = 'flagged'`;
        const params: string[] = [];
        
        if (config.bucketFilter) {
          sql += " AND bucket = $1";
          params.push(config.bucketFilter);
        }
        
        const result = await db.query<{ count: string }>(sql, params);
        const c = parseInt((result.data as { count: string }[])?.[0]?.count || "0", 10);
        buckets[bucketName] = c;
        totalFlagged += c;
      } catch {
        buckets[bucketName] = 0;
      }
    }

    return NextResponse.json({
      success: true,
      buckets,
      totalFlagged,
    });
  } catch (error) {
    console.error("Error fetching extraction counts:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch extractions"
    }, { status: 500 });
  }
}
