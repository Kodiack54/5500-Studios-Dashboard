import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ITEM_TABLES = [
  "dev_ai_todos",
  "dev_ai_bugs", 
  "dev_ai_knowledge",
  "dev_ai_docs",
  "dev_ai_journal",
  "dev_ai_conventions",
  "dev_ai_snippets",
  "dev_ai_decisions",
  "dev_ai_lessons",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspace = searchParams.get("workspace");

    // 1. Session counts (Chad's work)
    let sessionQuery = db.from("dev_ai_sessions").select("status, started_at");
    if (workspace) {
      sessionQuery = sessionQuery.eq("workspace", workspace);
    }
    const { data: sessions } = await sessionQuery;
    
    const sessionList = Array.isArray(sessions) ? sessions : [];
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    
    let activeSessions = 0, processedSessions = 0, last24h = 0;
    for (const s of sessionList) {
      const status = (s as Record<string, unknown>).status as string;
      const startedAt = (s as Record<string, unknown>).started_at as string;
      if (status === "active") activeSessions++;
      if (status === "processed") processedSessions++;
      if (startedAt) {
        const startTime = new Date(startedAt).getTime();
        if (now.getTime() - startTime < day) last24h++;
      }
    }

    // 2. Item counts by status using raw SQL
    let totalFlagged = 0, totalPending = 0, totalFinal = 0;
    
    for (const table of ITEM_TABLES) {
      try {
        const flaggedResult = await db.query<{ count: string }>(`SELECT COUNT(*) as count FROM ${table} WHERE status = 'flagged'`);
        const pendingResult = await db.query<{ count: string }>(`SELECT COUNT(*) as count FROM ${table} WHERE status = 'pending'`);
        const finalResult = await db.query<{ count: string }>(`SELECT COUNT(*) as count FROM ${table} WHERE status NOT IN ('flagged', 'pending')`);
        
        totalFlagged += parseInt((flaggedResult.data as { count: string }[])?.[0]?.count || "0", 10);
        totalPending += parseInt((pendingResult.data as { count: string }[])?.[0]?.count || "0", 10);
        totalFinal += parseInt((finalResult.data as { count: string }[])?.[0]?.count || "0", 10);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      buckets: {
        active: activeSessions,
        processed: processedSessions,
        flagged: totalFlagged,
        pending: totalPending,
        published: totalFinal,
      },
      stats: {
        total_sessions: sessionList.length,
        active: activeSessions,
        processed: processedSessions,
        flagged: totalFlagged,
        pending: totalPending,
        cleaned: totalFinal,
        archived: 0,
        last_24h: last24h,
        last_session: sessionList.length > 0 ? (sessionList[0] as Record<string, unknown>).started_at : null,
      },
    });
  } catch (error) {
    console.error("Error fetching bucket counts:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch buckets"
    }, { status: 500 });
  }
}
