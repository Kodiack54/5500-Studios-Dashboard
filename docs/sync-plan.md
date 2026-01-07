# Plan: Dashboard Source of Truth + Jen Mismatch Monitor + Git Version Discipline

## Overview

Make the dashboard the authoritative source for project file structure and DB schemas across all droplets. Jen monitors local extractions, compares to server truth, and flags discrepancies. Enforce git commit discipline with versioned logs.

---

## Phase 1: Dashboard as Source of Truth

### 1.1 Structure Tab - Real Droplet Files

**Goal:** Dashboard Structure tab shows actual files from each droplet, not just extracted data.

**Implementation:**
- Add API endpoint: `/api/structure/droplet/[dropletId]`
- Uses SSH to query droplet file structure (find command or ls -R)
- Caches results with TTL (5-10 minutes)
- Shows tree view per project/droplet

**Files to modify:**
- `/var/www/Studio/kodiack-dashboard-5500/src/app/api/structure/` - New API routes
- `/var/www/Studio/kodiack-dashboard-5500/src/app/structure/` - Structure page component

**SSH targets (confirmed working):**
- Development: 161.35.229.220 (local)
- Core-Droplet: 134.199.209.140
- NextBid-Engine: 64.23.151.201

### 1.2 DB Tab - Real Database Schemas

**Goal:** Dashboard DB tab shows actual table schemas from PostgreSQL.

**Implementation:**
- Add API endpoint: `/api/database/schemas`
- Query `information_schema.tables` and `information_schema.columns`
- Show table structure, constraints, indexes
- Compare across droplets if multiple DBs exist

**Files to modify:**
- `/var/www/Studio/kodiack-dashboard-5500/src/app/api/database/` - New API routes
- `/var/www/Studio/kodiack-dashboard-5500/src/app/database/` - DB page component

---

## Phase 2: Jen Mismatch Monitor

### 2.1 Extract + Compare Logic

**Goal:** Jen extracts file structure from local sessions, compares to dashboard truth, flags mismatches.

**Implementation:**
- After extracting structure from session content:
  1. Query dashboard API for server truth
  2. Compare extracted paths to server paths
  3. Flag discrepancies: new files, missing files, modified files

**Files to modify:**
- `/var/www/Studio/ai-team/ai-jen-5402/src/services/processor-v6.js`
  - Add `compareToServerTruth()` function after structure extraction
  - Add mismatch logging to `dev_ai_monitoring_mismatches` table

### 2.2 Mismatch Flagging

**When mismatch detected:**
- Log to `dev_ai_monitoring_mismatches` table
- Include: session_id, local_path, server_path, mismatch_type, timestamp
- Dashboard shows mismatch alerts

**New DB table:**
```sql
CREATE TABLE dev_ai_monitoring_mismatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  project_id UUID,
  local_path TEXT,
  server_path TEXT,
  mismatch_type TEXT, -- 'new_local', 'missing_local', 'modified'
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by TEXT
);
```

---

## Phase 3: Git Version Discipline

### 3.1 End-of-Day Commit Reminders

**Goal:** Flag user to commit changes at end of their work session.

**Implementation:**
- Jen detects "end of session" signals:
  - Session gaps > 30 minutes
  - Time-of-day thresholds (e.g., after 5pm)
  - Explicit session end markers
- Check for uncommitted changes (git status dirty)
- Log reminder to `dev_ai_commit_reminders` table
- Dashboard shows pending commit alerts

### 3.2 Git Commit Log with Versions

**Goal:** Track all commits with semantic versions (v1.0.025), timestamps, notes.

**Implementation:**
- New table: `dev_ai_git_commits`
- Populated by:
  - Jen extracting commit messages from session content
  - Git hooks on server repos (post-commit)
  - Manual dashboard entry

**New DB table:**
```sql
CREATE TABLE dev_ai_git_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  version_tag TEXT, -- 'v1.0.025'
  commit_hash TEXT,
  commit_message TEXT,
  commit_notes TEXT,
  author TEXT,
  committed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 Version Increment Logic

**Versioning scheme:** `v{major}.{minor}.{patch}`
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes, small changes (auto-increment)

**Auto-increment on commit:**
- Jen detects new commits
- Increments patch version
- Stores in `dev_ai_git_commits`

---

## Phase 4: Dashboard UI Updates

### 4.1 Structure Tab Enhancements
- Tree view of actual droplet files
- Highlight mismatches (local vs server)
- Filter by project/droplet

### 4.2 DB Tab Enhancements
- Show table schemas from live database
- Compare expected vs actual

### 4.3 Git Log Tab (New)
- Version history per project
- Commit notes and timestamps
- Pending commit alerts

---

## Implementation Order

1. **Dashboard API for droplet files** (SSH-based file listing)
2. **Dashboard API for DB schemas** (PostgreSQL introspection)
3. **Jen mismatch detection** (compare extractions to dashboard truth)
4. **DB tables for monitoring** (mismatches, commits, reminders)
5. **End-of-day commit flagging** (Jen session analysis)
6. **Git commit logging** (version tracking)
7. **Dashboard UI** (structure, DB, git log tabs)

---

## Critical Files

| Component | File Path |
|-----------|-----------|
| Dashboard Structure API | `/var/www/Studio/kodiack-dashboard-5500/src/app/api/structure/` |
| Dashboard DB API | `/var/www/Studio/kodiack-dashboard-5500/src/app/api/database/` |
| Jen Processor | `/var/www/Studio/ai-team/ai-jen-5402/src/services/processor-v6.js` |
| Shared DB Client | `/var/www/Studio/ai-team/shared/db.js` |

---

## Dependencies

- SSH access from Development droplet to other droplets (Core, Engine confirmed)
- PostgreSQL access for schema introspection
- Dashboard running on port 5500
