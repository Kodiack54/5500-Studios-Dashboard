# HOW TO: Pair External Claude to Terminal-5400 with Tokens (Multi-User Safe)

> **Status:** Future Implementation - Revisit when hiring second dev
> **Created:** 2026-01-04
> **Context:** AI Pipeline Truth Enforcement - Phase 3 planning

---

## Overview

When multiple developers use External Claude simultaneously, the terminal-5400 server needs to know which transcripts belong to which user. This document describes a token-based authentication system that solves this problem.

**Current State (Single Dev):** Terminal-5400 can look up the only active `dev_user_context` row and inject identity into all transcripts.

**Future State (Multi-Dev):** Each External Claude session must authenticate with a unique token tied to a specific user.

---

## The Problem

External Claude connects to terminal-5400 with:
```
mode=claude project_id=null user_id=null pc_tag=null
```

With multiple devs, terminal-5400 can't know which user's External Claude is sending commands. Result: transcripts arrive at 9500 with NULL identity, Chad can't resolve context, sessions get marked `needs_context`.

---

## The Solution: Token-Based Authentication

### Flow

```
Developer                      Studio Dashboard                Terminal-5400                  Transcripts-9500
    |                                |                              |                              |
    |-- Login to Studio ------------>|                              |                              |
    |                                |-- Creates dev_user_context --|                              |
    |                                |                              |                              |
    |-- Click "Start Project" ------>|                              |                              |
    |                                |-- Generate signed token ------|                              |
    |<- Return token + instructions--|                              |                              |
    |                                |                              |                              |
    |-- Configure External Claude--->|                              |                              |
    |   (paste token)                |                              |                              |
    |                                |                              |                              |
    |-- /startproject TOKEN ---------|-------------------------->---|                              |
    |                                |                              |-- Validate token             |
    |                                |                              |-- Bind socket to user_id     |
    |                                |                              |                              |
    |-- Send commands ---------------|-------------------------->---|                              |
    |                                |                              |-- Inject user_id/pc_tag      |
    |                                |                              |------------------------>-----|
    |                                |                              |                              |-- Store with identity
```

### Step 1: Studio Generates Token

When developer clicks "Start Project" in Studio:

```javascript
// Dashboard API: /api/dev-session/start-external
const crypto = require('crypto');

function generateExternalClaudeToken(userId, pcTag, projectId, devSlot) {
  const payload = {
    user_id: userId,
    pc_tag: pcTag,
    project_id: projectId,
    dev_slot: devSlot,
    issued_at: Date.now(),
    expires_at: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
  };

  const signature = crypto
    .createHmac('sha256', process.env.TOKEN_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return Buffer.from(JSON.stringify({ ...payload, sig: signature })).toString('base64');
}
```

### Step 2: Developer Configures External Claude

Studio shows:
```
Your External Claude Token:
eyJ1c2VyX2lkIjoiMTU3ZDBkOD...

To connect, run this command in External Claude:
/startproject eyJ1c2VyX2lkIjoiMTU3ZDBkOD...
```

Developer pastes the `/startproject TOKEN` command into their External Claude session.

### Step 3: Terminal-5400 Validates Token

```javascript
// terminal-server-5400/src/server.js

const activeTokens = new Map(); // tokenHash -> { user_id, pc_tag, project_id, socket }

function validateToken(tokenBase64) {
  try {
    const payload = JSON.parse(Buffer.from(tokenBase64, 'base64').toString());

    // Check expiry
    if (Date.now() > payload.expires_at) return null;

    // Verify signature
    const { sig, ...data } = payload;
    const expected = crypto
      .createHmac('sha256', process.env.TOKEN_SECRET)
      .update(JSON.stringify(data))
      .digest('hex');

    if (sig !== expected) return null;

    return data;
  } catch (e) {
    return null;
  }
}

// Handle /startproject command
function handleStartProject(socket, token) {
  const validated = validateToken(token);
  if (!validated) {
    socket.write('Invalid or expired token\n');
    return;
  }

  // Bind identity to this socket
  socket.userId = validated.user_id;
  socket.pcTag = validated.pc_tag;
  socket.projectId = validated.project_id;

  // Store for lookup
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  activeTokens.set(tokenHash, {
    user_id: validated.user_id,
    pc_tag: validated.pc_tag,
    project_id: validated.project_id,
    socket: socket,
  });

  socket.write(`Connected as ${validated.user_id} to project ${validated.project_id}\n`);
}
```

### Step 4: Terminal-5400 Injects Identity

Every transcript from this socket gets identity injected:

```javascript
async function sendTranscript(session, content, role) {
  const payload = {
    timestamp: new Date().toISOString(),
    content,
    role,
    source_service: 'terminal-5400',
    // Identity from bound socket
    user_id: session.socket?.userId || null,
    pc_tag: session.socket?.pcTag || null,
    project_id: session.socket?.projectId || null,
  };

  await fetch(TRANSCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
```

---

## Database Schema (Optional)

For audit trail and revocation:

```sql
CREATE TABLE dev_external_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  pc_tag TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  dev_slot TEXT,
  token_hash TEXT UNIQUE NOT NULL,  -- SHA256 of full token
  issued_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  last_used_at TIMESTAMP,

  CONSTRAINT token_not_expired CHECK (revoked_at IS NULL OR revoked_at > issued_at)
);

-- Index for fast lookup
CREATE INDEX idx_external_tokens_hash ON dev_external_tokens(token_hash) WHERE revoked_at IS NULL;
```

---

## Security Considerations

1. **Token expiry:** 8-hour default, matching typical work day
2. **One token per dev per project:** Revoke previous when issuing new
3. **Token stored only hashed:** Original token never saved server-side
4. **Revocation:** Dashboard can revoke tokens (e.g., when dev disconnects)
5. **Audit log:** Track token usage for debugging

---

## UI Changes Required

### Studio Dashboard

Add "External Claude" section to dev session panel:

```tsx
// ExternalClaudePanel.tsx
function ExternalClaudePanel({ sessionId, userId, pcTag, projectId, devSlot }) {
  const [token, setToken] = useState(null);

  const generateToken = async () => {
    const res = await fetch('/api/dev-session/external-token', {
      method: 'POST',
      body: JSON.stringify({ userId, pcTag, projectId, devSlot }),
    });
    const { token } = await res.json();
    setToken(token);
  };

  return (
    <div>
      <h3>External Claude Connection</h3>
      {!token ? (
        <button onClick={generateToken}>Generate Token</button>
      ) : (
        <div>
          <code>/startproject {token}</code>
          <button onClick={() => navigator.clipboard.writeText(`/startproject ${token}`)}>
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Migration Path

1. **Phase 1 (Current - Single Dev):** Terminal-5400 looks up only active `dev_user_context` and injects. Works because there's only one dev.

2. **Phase 2 (When Hiring):** Implement token system before second dev starts. Test with both devs using separate tokens.

3. **Phase 3 (Production):** Full rollout with revocation, audit logging, and dashboard UI.

---

## Testing Checklist

- [ ] Generate token from Studio
- [ ] Paste `/startproject TOKEN` into External Claude
- [ ] Verify terminal-5400 logs show correct user binding
- [ ] Send commands, verify transcripts have `user_id` populated
- [ ] Test token expiry (set short expiry, wait, verify rejection)
- [ ] Test with two tokens simultaneously (future)
- [ ] Test token revocation (future)

---

## Related Files

| File | Purpose |
|------|---------|
| `/var/www/Studio/ai-team/terminal-server-5400/src/server.js` | Add token validation |
| `kodiack-dashboard-5500/src/app/api/dev-session/external-token/route.ts` | Token generation endpoint |
| `kodiack-dashboard-5500/src/app/components/ExternalClaudePanel.tsx` | UI component |
| Database migration | `dev_external_tokens` table |

---

## Summary

**The Rule:** Every transcript must have identity. Tokens make this possible with multiple devs.

**For Now:** Single-dev mode works without tokens (terminal-5400 can look up the only active context).

**When Ready:** Implement this token system before onboarding second developer.
