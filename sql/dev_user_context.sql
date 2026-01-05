-- dev_user_context: GLOBAL SOURCE OF TRUTH (login → logout)
-- Keyed by (user_id, pc_tag). One active context per user/machine.
--
-- UI is the event source. Every navigation that changes what the dev
-- is doing fires a context update. 9500 records facts. Chad resolves
-- deterministically via this table. NO AI GUESSES.

CREATE TABLE IF NOT EXISTS dev_user_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity (unique active context per user+machine)
    user_id UUID NOT NULL,
    pc_tag TEXT NOT NULL,

    -- What they're doing
    mode TEXT NOT NULL CHECK (mode IN ('project', 'forge', 'helpdesk', 'ops', 'roadmap', 'meeting', 'break')),
    project_id UUID,  -- REQUIRED when mode='project', NULL otherwise
    project_slug TEXT,
    dev_team TEXT CHECK (dev_team IS NULL OR dev_team IN ('dev1', 'dev2', 'dev3')),

    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,  -- NULL = active, set when context ends

    -- Audit
    source TEXT NOT NULL CHECK (source IN ('universal', 'studio', 'autoflip', 'timeclock', 'manual')),
    locked BOOLEAN DEFAULT false,

    -- Constraints
    CONSTRAINT project_required_for_project_mode
        CHECK (mode != 'project' OR project_id IS NOT NULL),
    CONSTRAINT project_null_for_non_project_mode
        CHECK (mode = 'project' OR project_id IS NULL)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_dev_user_context_user_pc
    ON dev_user_context(user_id, pc_tag);

CREATE INDEX IF NOT EXISTS idx_dev_user_context_active
    ON dev_user_context(user_id, pc_tag, ended_at)
    WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dev_user_context_timestamp
    ON dev_user_context(started_at, ended_at);

-- Unique constraint: only ONE active context per (user_id, pc_tag)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dev_user_context_one_active
    ON dev_user_context(user_id, pc_tag)
    WHERE ended_at IS NULL;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_dev_user_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on any change
DROP TRIGGER IF EXISTS trigger_update_dev_user_context_timestamp ON dev_user_context;
CREATE TRIGGER trigger_update_dev_user_context_timestamp
    BEFORE UPDATE ON dev_user_context
    FOR EACH ROW
    EXECUTE FUNCTION update_dev_user_context_timestamp();

-- Comments for documentation
COMMENT ON TABLE dev_user_context IS 'GLOBAL SOURCE OF TRUTH for user context (login→logout). UI events update this, 9500 records facts, Chad resolves deterministically.';
COMMENT ON COLUMN dev_user_context.mode IS 'What the user is doing: project|forge|helpdesk|ops|meeting|break';
COMMENT ON COLUMN dev_user_context.source IS 'What triggered this context: universal|studio|autoflip|timeclock|manual';
COMMENT ON COLUMN dev_user_context.ended_at IS 'NULL = active context, set when context ends or changes';
