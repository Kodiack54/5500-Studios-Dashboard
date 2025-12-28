import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Daily budget per team member
const DAILY_BUDGET_PER_MEMBER = 0.50;
const TEAM_MEMBERS = ['chad', 'jen', 'susan', 'clair', 'mike', 'tiffany', 'ryan'];

export async function GET() {
  try {
    // Get today's usage from dev_ai_usage table, grouped by team member (continuity field)
    const todayResult = await db.query<{
      continuity: string;
      requests: string;
      total_tokens: string;
      cost_usd: string;
    }>(`
      SELECT
        COALESCE(continuity, 'unknown') as continuity,
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(cost_usd::numeric), 0) as cost_usd
      FROM dev_ai_usage
      WHERE created_at >= CURRENT_DATE
      GROUP BY continuity
    `);

    // Build per-member usage
    const byMember: Record<string, { requests: number; tokens: number; cost: number }> = {};

    // Initialize all members with 0
    for (const member of TEAM_MEMBERS) {
      byMember[member] = { requests: 0, tokens: 0, cost: 0 };
    }

    // Fill in actual data
    if (todayResult.data && Array.isArray(todayResult.data)) {
      for (const row of todayResult.data) {
        const member = row.continuity?.toLowerCase() || 'unknown';
        byMember[member] = {
          requests: parseInt(row.requests, 10) || 0,
          tokens: parseInt(row.total_tokens, 10) || 0,
          cost: parseFloat(row.cost_usd) || 0,
        };
      }
    }

    // Calculate totals
    const totals = {
      requests: 0,
      total_tokens: 0,
      cost_usd: 0,
    };

    const by_assistant = TEAM_MEMBERS.map(member => {
      const data = byMember[member] || { requests: 0, tokens: 0, cost: 0 };
      totals.requests += data.requests;
      totals.total_tokens += data.tokens;
      totals.cost_usd += data.cost;

      return {
        assistant_name: member,
        requests: data.requests,
        total_tokens: data.tokens,
        cost_usd: data.cost,
      };
    });

    // Daily budget calculation
    const daily_limit = DAILY_BUDGET_PER_MEMBER * TEAM_MEMBERS.length; // $3.50/day total
    const budget = {
      daily_limit,
      used: totals.cost_usd,
      percent_used: daily_limit > 0 ? (totals.cost_usd / daily_limit) * 100 : 0,
    };

    return NextResponse.json({
      success: true,
      totals,
      budget,
      by_assistant,
    });
  } catch (error) {
    console.error('AI usage query failed:', error);

    // Return empty data on error
    return NextResponse.json({
      success: true,
      totals: {
        requests: 0,
        total_tokens: 0,
        cost_usd: 0,
      },
      budget: {
        daily_limit: 3.50,
        used: 0,
        percent_used: 0,
      },
      by_assistant: TEAM_MEMBERS.map(name => ({
        assistant_name: name,
        requests: 0,
        total_tokens: 0,
        cost_usd: 0,
      })),
    });
  }
}
