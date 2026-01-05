# AI Pipeline Refactor: Truth Enforcement

## Project Goal

**Kill all guessing. Enforce truth at every handoff.**

The pipeline has been corrupted by "helpful" fallbacks that flip project identity at every step. This refactor removes ALL inference, ALL recovery logic, ALL fallback UUIDs.

If `project_id` is missing → **STOP. FAIL. DO NOT GUESS.**

---

## Canonical Truth (LOCKED)

### `dev_sessions` is the SINGLE SOURCE OF TRUTH for project identity

All project attribution comes from here:
- `project_id`
- `project_uuid`
- `project_slug`
- `pc_tag`

**Studio is the ONLY system that assigns project identity.**

---

## Service Responsibilities (Non-Negotiable)

### Terminal (5410/5420/5430)
- **Passes through:** `pc_tag`, `project_id` (if Studio provided it)
- **NEVER assigns**
- **NEVER guesses**

### Transcripts (9500)
- **Stores raw facts only:** timestamp, pc_tag, project_id (if present)
- **NO defaults**
- **NO inference**
- **NO fallback UUIDs**
- External Claude transcripts DO NOT know the project - resolved later by Chad

### Chad (5401) — Session Materializer
- **Role:** Resolve time-based ownership
- **Logic:** `pc_tag + timestamp` → lookup active `dev_session` → inherit `project_id`
- **If no active dev_session → FAIL / UNASSIGNED**
- **NO guessing**
- **NO fallback**
- This is how external + internal Claude unify correctly

### Susan (5403) — Cleaner
- **Input:** `(project_id, time_window, ordered_sessions)` - ALREADY SCOPED
- **FORBIDDEN:** pc_tag lookup, slug lookup, path traversal, ownership inference
- **ONLY:** Receives scoped data, cleans within boundary, outputs work logs for same project_id
- **NOT a decider. A cleaner.**

### Jen (5402) — Structure Extractor
- **Purely downstream**
- Inherit `project_id` from session
- **NEVER decide ownership**
- **NEVER recover ownership**
- **NEVER reassign**

### Jason (5408) — Semantic Extractor
- **Purely downstream**
- Inherit `project_id` from session
- **NEVER decide ownership**
- **NEVER recover ownership**
- **NEVER reassign**

---

## The Core Bug (Now Identified)

> "We are flipping project identity at every handoff"

Multiple services tried to "be helpful" with fallbacks instead of **refusing to proceed without truth**.

### Examples of bullshit that must die:
- `detectProjectFromPath()` - guesses from file path
- Hardcoded `project_path: '/var/www/Kodiack_Studio/dev-studio-5000'`
- `|| null` fallbacks on project_id
- Slug inference from content
- Path traversal to find project root
- "Unassigned" bucket as catch-all instead of failure

---

## The Non-Negotiable Rule

> **If `project_id` is missing → STOP.**
>
> Not infer. Not recover. Not fix later.

This makes the pipeline **cohesive instead of fragile**.

---

## Current Data Flow

1. **UI connects to terminal** → sends `project_id` in URL params
2. **Terminal server (5410/5420/5430)** → passes through to transcripts-9500
3. **transcripts-9500** → stores to `dev_transcripts_raw` with `project_id` (if present)
4. **Chad** (`/var/www/Studio/ai-team/ai-chad-5401/src/server.js`) → resolves ownership
   - Queries `dev_sessions` table by `pc_tag` via `getActiveDevSession()` (line 33-53)
   - Uses `activeSession.project_id` when creating `dev_ai_sessions` (line 396)
5. **Susan** (`/var/www/Studio/ai-team/ai-susan-5403/src/`) → cleans sessions
   - Receives already-scoped `(project_id, time_window, sessions)`
   - Strips noise, removes gaps, extracts dialogue
   - Writes work logs for same project_id
6. **Jason** (`/var/www/Studio/ai-team/ai-jason-5408/src/extract/bundleSessions.js`) → inherits from session
   - Reads `project_id` from `dev_ai_sessions` (line 31)
   - Passes to extractions (line 68, 114)
7. **Jason** (`/var/www/Studio/ai-team/ai-jason-5408/src/run.js`) → writes to `dev_ai_smart_extractions`
   - Uses `bundle.project_id` (line 146, 162)

```
Studio UI
    ↓ project_id assigned
dev_sessions (TRUTH)
    ↓ pc_tag + timestamp lookup
Terminal → Transcripts → Chad
    ↓ project_id inherited
dev_ai_sessions
    ↓ project_id inherited
Susan (clean) → Jason (extract)
    ↓ project_id inherited
dev_ai_smart_extractions
```

**Every arrow = inheritance, not decision.**

---

## The Real Issue: No New Extractions Exist

Even though sessions now have correct `project_id`, there are **0 extractions** for Studios Platform because:
1. Jason only extracts from sessions with status='cleaned'
2. Recent sessions may not have been processed by Susan (cleaner) yet
3. Or Jason hasn't run on the cleaned sessions yet

---

## IMPLEMENTATION PHASES (Non-Negotiable Order)

### Phase 1: Obsolescence Lockdown

**Goal:** Force failures early. Expose who is still calling dead logic.

Create `obsolete/` directory inside each service and MOVE (not delete):
- Legacy project detection functions
- Fallback assignment logic
- Unused processors
- Deprecated Susan/Jen paths
- Path-based guessing code

**DO NOT rewrite yet. Only remove.**

Let APIs fail loudly. Any failure = still-calling-dead-code.

| Service | Files to Archive |
|---------|-----------------|
| Jen 5402 | `detectProjectFromPath()` function in processor-v6.js |
| Chad 5411 | sourceWatcher.js hardcoded project_path logic (line 225) |
| Susan 5403 | Any project lookup/resolution code |
| Any | Slug inference, path traversal, fallback UUIDs |

**Success criteria:** Services fail clearly when old code is called instead of silently guessing.

---

### Phase 2: Hard Input Contracts

**Goal:** Define exactly what each service receives. No ambiguity.

#### Susan Input Contract (LOCKED)
```
Input: (project_id, time_window, ordered_sessions)
Output: work_logs for same project_id
```

Susan is **FORBIDDEN** from:
- `pc_tag` lookup
- `slug` lookup
- `project_path` traversal
- Any ownership inference

Susan **ONLY**:
- Receives already-scoped data
- Operates inside known project boundary
- Cleans + compresses + normalizes dialogue
- Outputs work logs for that same project_id

**Example flow:**
```
"Here is 9:00-12:00, already resolved to Project X"
→ Susan strips noise
→ Removes span gaps
→ Extracts only dialogue
→ Writes work logs → Project X

"Here is 9:00-12:00, already resolved to Project Y"
→ Same process → Project Y
```

No guessing. No cross-contamination. No recovery logic.

#### Child Projects
Each child project builds itself independently from its own scoped input.
Trees are built only from provided project root - never traversed to discover.

---

### Phase 3: Extraction Resume (ONLY after Phases 1 & 2)

**Only once:**
- Obsolete code is archived
- Ownership is never guessed
- Susan is scoped

**Then — and only then:**
1. Resume Jason
2. Re-run extractions for sessions with correct project_id
3. Consider historical migration (optional, last)

---

## Verification Checklist

Before proceeding to next phase:

- [ ] Are we done touching the terminal? **YES**
- [ ] Are we done moving data? **YES**
- [ ] Are we enforcing truth before fixing output? **YES**
- [ ] Is Susan now a cleaner, not a decider? **YES**

---

## Files to Audit (Phase 1)

| Service | File | What to look for |
|---------|------|------------------|
| Terminal 5400 | `/var/www/Studio/ai-team/terminal-server-5400/src/server.js` | Any default project_id assignment |
| Transcripts 9500 | `/var/www/Studio/ai-team/ai-transcripts-9500/index.js` | Any fallback UUIDs or inference |
| Chad 5401 | `/var/www/Studio/ai-team/ai-chad-5401/src/server.js` | Any fallback beyond 'unassigned' |
| Jen 5402 | `/var/www/Studio/ai-team/ai-jen-5402/src/services/processor-v6.js` | `detectProjectFromPath()` ✓ FOUND |
| Susan 5403 | `/var/www/Studio/ai-team/ai-susan-5403/src/` | Any project lookup/assignment |
| Jason 5408 | `/var/www/Studio/ai-team/ai-jason-5408/src/` | Any project assignment |
| Chad 5411 | `/var/www/Studio/ai-team/ai-chad-5411/src/services/sourceWatcher.js` | Hardcoded path (line 225) ✓ FOUND |

### Known Violations (Already Found)

1. **sourceWatcher.js line 225**: Hardcoded `project_path: '/var/www/Kodiack_Studio/dev-studio-5000'`
2. **processor-v6.js**: Has `detectProjectFromPath()` function that tries to infer project

### Audit Criteria

For each file, search for:
- `|| null` patterns on project_id
- Default UUID assignments
- `detectProject` or `resolveProject` functions
- Fallback logic like `if (!project_id) { ... }`

Remove all fallbacks. If project_id is missing, the record should be tagged 'unassigned' or rejected - NOT guessed.

---

## Key Files

| File | Purpose |
|------|---------|
| `/var/www/Studio/ai-team/ai-chad-5401/src/server.js` | Creates `dev_ai_sessions` from raw transcripts, assigns `project_id` from `dev_sessions` |
| `/var/www/Studio/ai-team/ai-jason-5408/src/extract/bundleSessions.js` | Bundles sessions by project, reads `project_id` from sessions |
| `/var/www/Studio/ai-team/ai-jason-5408/src/run.js` | Extracts todos/bugs/worklogs, writes to `dev_ai_smart_extractions` with `project_id` |
| `/var/www/Studio/ai-team/terminal-server-5400/src/server.js` | Terminal server receives `project_id` from UI, sends to transcripts |
| `/var/www/Studio/ai-team/ai-susan-5403/src/` | Cleans sessions, outputs work logs - MUST receive scoped input |

## Tables

| Table | Role |
|-------|------|
| `dev_sessions` | **TRUTH** - Active Studio UI sessions with correct `project_id` (managed by dashboard) |
| `dev_transcripts_raw` | Raw terminal output with `project_id` (if present) |
| `dev_ai_sessions` | Processed sessions with `project_id` (created by Chad) |
| `dev_ai_smart_extractions` | Final extractions with `project_id` (created by Jason) |

---

## Verification Steps (Before Any Fix)

```sql
-- 1. Check if there are cleaned sessions for Studios
SELECT id, project_id, project_slug, status, created_at
FROM dev_ai_sessions
WHERE project_id = '21bdd846-7b03-4879-b5ea-04263594da1e'
  AND status = 'cleaned'
ORDER BY created_at DESC LIMIT 10;

-- 2. Check Jason's last run
SELECT * FROM dev_ai_extraction_runs ORDER BY created_at DESC LIMIT 5;

-- 3. Check if Susan is cleaning sessions
SELECT status, COUNT(*) FROM dev_ai_sessions
WHERE project_id = '21bdd846-7b03-4879-b5ea-04263594da1e'
GROUP BY status;
```

---

## Fix Options (ONLY after Phases 1 & 2)

### Option A: Force Jason to Process Studios Sessions
If there are cleaned sessions for Studios but Jason hasn't extracted them:

```bash
cd /var/www/Studio/ai-team/ai-jason-5408
node src/run.js --slug=studios
```

### Option B: Migrate Historical Data (If Needed)
Only if we confirm old data should belong to Studios:

```sql
-- Preview: Find extractions from sessions that now have correct project_id
SELECT e.id, e.bucket, e.project_id as current_project, s.project_id as session_project
FROM dev_ai_smart_extractions e
JOIN dev_ai_sessions s ON s.id = e.source_session_id
WHERE s.project_id = '21bdd846-7b03-4879-b5ea-04263594da1e'
  AND e.project_id != '21bdd846-7b03-4879-b5ea-04263594da1e'
LIMIT 20;

-- If rows exist, migrate them:
UPDATE dev_ai_smart_extractions e
SET project_id = s.project_id
FROM dev_ai_sessions s
WHERE s.id = e.source_session_id
  AND s.project_id IS NOT NULL
  AND e.project_id != s.project_id;
```

---

## The Rule (Final)

> **If `project_id` is missing → STOP.**
>
> Not infer. Not recover. Not fix later.
>
> **No more bullshit guessing.**

---

**DO NOT proceed until user approves each phase.**
