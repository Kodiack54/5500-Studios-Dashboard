# Plan: Truth Snapshots + Git Discipline + Hygiene Alerts

## Overview

Store canonical "truth snapshots" per droplet in DB. Dashboard and Jen both read from this single source of truth. Git hooks write commits directly to DB. Hygiene alerts flag dirty repos, unpushed commits, and stale snapshots.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Development   │     │  Core-Droplet   │     │ NextBid-Engine  │
│  161.35.229.220 │     │ 134.199.209.140 │     │  64.23.151.201  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  collector.js (cron)  │  collector.js (cron)  │  collector.js (cron)
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL (kodiack_ai)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ dev_ai_truth_   │  │ dev_ai_git_     │  │ dev_ai_hygiene_ │  │
│  │ snapshots       │  │ commits         │  │ alerts          │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         ▲                                           ▲
         │                                           │
    ┌────┴────┐                               ┌──────┴──────┐
    │Dashboard│                               │     Jen     │
    │  :5500  │                               │    :5402    │
    └─────────┘                               └─────────────┘
    (reads snapshots)                    (compares extractions)
```

**Key Principle:** Droplets push truth to DB. Dashboard and Jen pull from DB. No SSH orchestration from Dashboard.

---

## Phase 0: Droplet Configuration

```sql
CREATE TABLE dev_ai_droplets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  ssh_user TEXT DEFAULT 'root',
  projects_root TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO dev_ai_droplets (slug, name, ip_address, projects_root) VALUES
  ('development', 'Development', '161.35.229.220', '/var/www/Studio'),
  ('core-droplet', 'Core Droplet', '134.199.209.140', '/var/www'),
  ('nextbid-engine', 'NextBid Engine', '64.23.151.201', '/var/www');
```

---

## Phase 1: Database Tables

### 1.1 Truth Snapshots Table

```sql
CREATE TABLE dev_ai_truth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  droplet_id UUID REFERENCES dev_ai_droplets(id),
  project_slug TEXT NOT NULL,
  repo_path TEXT NOT NULL,
  file_tree JSONB NOT NULL,
  git_branch TEXT,
  git_commit_hash TEXT,
  git_dirty BOOLEAN DEFAULT false,
  git_ahead_count INT DEFAULT 0,
  git_behind_count INT DEFAULT 0,
  git_remote TEXT DEFAULT 'origin',
  snapshot_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(droplet_id, repo_path)
);
```

### 1.2 Git Commit Log Table

```sql
CREATE TABLE dev_ai_git_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  droplet_id UUID REFERENCES dev_ai_droplets(id),
  project_slug TEXT NOT NULL,
  repo_path TEXT NOT NULL,
  commit_hash TEXT NOT NULL,
  commit_message TEXT,
  author_name TEXT,
  author_email TEXT,
  version_tag TEXT,
  latest_reachable_tag TEXT,
  committed_at TIMESTAMP,
  pushed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(droplet_id, repo_path, commit_hash)
);
```

### 1.3 Hygiene Alerts Table

```sql
CREATE TABLE dev_ai_hygiene_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  droplet_id UUID REFERENCES dev_ai_droplets(id),
  project_slug TEXT NOT NULL,
  repo_path TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  message TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by TEXT
);

-- Idempotent: one active alert per repo/type (no spam)
CREATE UNIQUE INDEX dev_ai_hygiene_alerts_active_uniq
  ON dev_ai_hygiene_alerts (droplet_id, repo_path, alert_type)
  WHERE resolved_at IS NULL;
```

---

## Phase 2: Snapshot Collector Script

**Location:** `/var/www/Studio/tools/collector.js`

**Cron:** Every 5 minutes

**File Tree Exclusions:**
```javascript
const EXCLUDE_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', '.cache', 'coverage', '.turbo'];
```

---

## Phase 3: Dashboard APIs

| Endpoint | Purpose |
|----------|---------|
| GET /api/truth/snapshots | List snapshots by droplet/project |
| GET /api/truth/commits | Git commit history |
| GET /api/truth/alerts | Active hygiene alerts |
| POST /api/truth/alerts/[id]/resolve | Mark alert resolved |

---

## Phase 4: Dashboard UI

- Structure Tab: File tree from snapshots + age indicator
- Git Log Tab: Version history + tags
- Alerts Panel: Unresolved hygiene issues

---

## Phase 5: Git Hooks

**Central script:** `/var/www/Studio/tools/git-log-ingest.sh` (secrets here, not in repos)

**Post-commit hook:** `.git/hooks/post-commit`
```bash
#!/bin/bash
/var/www/Studio/tools/git-log-ingest.sh "$(pwd)"
```

---

## Phase 6: Jen Mismatch Monitor

- Compares extractions to truth snapshots
- Logs mismatches to `dev_ai_structure_mismatches`

---

## Implementation Order

| Step | Task |
|------|------|
| 1 | Create DB tables |
| 2 | Seed droplet config |
| 3 | Build collector.js |
| 4 | Set up cron |
| 5 | Dashboard APIs |
| 6 | Dashboard UI |
| 7 | Git hooks |
| 8 | Jen mismatch compare |

---

## Success Criteria

1. Snapshots update every 5 minutes, excluding heavy dirs
2. Dashboard shows latest snapshot + age + stale indicator (computed server-side)
3. Alerts do not spam (one active alert per repo/type via partial unique index)
4. Commit log populated by git-native hook ingestion (secrets in central script only)
5. Version tags display correctly (exact-match + latest reachable stored separately)
6. Jen mismatch compare uses truth store and writes mismatch rows deterministically
