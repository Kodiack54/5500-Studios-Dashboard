// Session Hub types for pipeline monitoring

export interface WorkerStatus {
  isRunning: boolean;
  queue: number;
  processed: number;
  lastActivity: string | null;
  error: string | null;
}

export interface ChadStatus extends WorkerStatus {
  sessionsCapured: number;
  lastDumpTime: string | null;
  dumpIntervalMin: number;
}

export interface JenStatus extends WorkerStatus {
  itemsFlagged: number;
  currentlyProcessing: string | null;
}

export interface SusanStatus extends WorkerStatus {
  itemsCategorized: number;
  currentlyFiling: string | null;
}

// Dynamic bucket - can be any category Susan uses
export interface Bucket {
  name: string;
  count: number;
  icon?: string;
  color?: string;
}

// All buckets as a dynamic record
export type BucketCounts = Record<string, number>;

export interface Session {
  id: string;
  title: string;
  status: 'capturing' | 'dumped' | 'scrubbing' | 'flagged' | 'categorizing' | 'complete';
  started_at: string;
  ended_at?: string;
  message_count: number;
  source_type: string;
  source_name: string;
  project_path: string;
  // Pipeline tracking
  captured_by_chad: boolean;
  captured_at?: string;
  scrubbed_by_jen: boolean;
  scrubbed_at?: string;
  categorized_by_susan: boolean;
  categorized_at?: string;
  // Flags found by Jen
  flags_found?: number;
}

export interface PipelineHealth {
  chad: 'healthy' | 'stuck' | 'error' | 'idle';
  jen: 'healthy' | 'stuck' | 'error' | 'idle';
  susan: 'healthy' | 'stuck' | 'error' | 'idle';
  overall: 'healthy' | 'degraded' | 'down';
}

export interface PipelineMetrics {
  // Chad metrics
  sessionsLast10Min: number;
  sessionsLastHour: number;

  // Jen metrics
  itemsFlaggedLast10Min: number;
  itemsFlaggedLastHour: number;

  // Susan metrics
  itemsCategorizedLast10Min: number;
  itemsCategorizedLastHour: number;

  // Bucket totals (pending items)
  totalPending: number;

  // Trends (positive = increasing, negative = decreasing)
  bucketTrend: number;
}
