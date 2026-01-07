# Plan: Persistent Studio Terminal Session

> **Status:** Deferred - Revisit later
> **Created:** 2026-01-05

## The Problem

When you navigate away from `/studio` (to session-logs, project-management, etc.), the ClaudeTerminal component unmounts and:
- WebSocket connection is orphaned
- Terminal output/history is lost
- Returning to Studio requires full reconnect

**You want:** Connect once when starting a session, stay connected until disconnect/logout.

---

## The Solution: Lift WebSocket to DeveloperContext

The DeveloperContext already manages session state and persists to sessionStorage. We just need to also manage the terminal WebSocket there.

### Architecture Change

**Before:**
```
DeveloperContext (session metadata only)
    ↓
StudioPage
    ↓
ClaudeTerminal (creates WebSocket, manages connection)
    ↓
Navigate away → Component unmounts → WebSocket orphaned
```

**After:**
```
DeveloperContext (session metadata + WebSocket + terminal state)
    ↓
Connect() → Creates WebSocket, stores in context
    ↓
StudioPage → ClaudeTerminal (attaches to existing WebSocket)
    ↓
Navigate away → Component unmounts → WebSocket stays in context
    ↓
Return to Studio → ClaudeTerminal reattaches to existing WebSocket
```

---

## Implementation Steps

### 1. Extend DeveloperContext

Add to `DeveloperContext.tsx`:

```typescript
interface DeveloperContextValue {
  // ... existing fields ...

  // Terminal WebSocket (persists across navigation)
  terminalWs: WebSocket | null;
  terminalOutput: string[];  // Buffered output for replay

  // Actions
  sendToTerminal: (data: string) => void;
  onTerminalOutput: (callback: (data: string) => void) => () => void;
}
```

### 2. Move WebSocket Creation to connect()

In `connect()` function, after successful API connection:
1. Create WebSocket to `ws://161.35.229.220:{basePort}`
2. Store in context state
3. Set up message handler to buffer output
4. Send initial commands (claude, /startproject)

### 3. Simplify ClaudeTerminal

ClaudeTerminal becomes a "view" component:
- On mount: Get WebSocket from context, attach xterm
- Replay buffered output to xterm
- Subscribe to new output
- On unmount: Just detach xterm (don't close WebSocket)

### 4. Clean Up on disconnect()

In `disconnect()` function:
- Close WebSocket
- Clear output buffer
- Clear sessionStorage

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/contexts/DeveloperContext.tsx` | Add WebSocket management, output buffer, send/receive functions |
| `src/app/studio/terminal/ClaudeTerminal.tsx` | Simplify to use context WebSocket, remove local connection logic |
| `src/app/studio/page.tsx` | No changes needed |

---

## Key Code Changes

### DeveloperContext.tsx

```typescript
// Add to state
const [terminalWs, setTerminalWs] = useState<WebSocket | null>(null);
const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
const outputCallbacks = useRef<Set<(data: string) => void>>(new Set());

// In connect() - after API success
const ws = new WebSocket(`ws://161.35.229.220:${selectedTeam.basePort}`);
ws.onopen = () => {
  // Start claude session
  setTimeout(() => ws.send('claude\r'), 2000);
  setTimeout(() => ws.send('\r'), 2500);
  // Send /startproject after briefing delay
  setTimeout(() => {
    ws.send(`/startproject ${projectSlug} ${devSlot} ${pcTag}\r`);
  }, 25000);
};
ws.onmessage = (event) => {
  const data = event.data;
  setTerminalOutput(prev => [...prev.slice(-1000), data]); // Keep last 1000 chunks
  outputCallbacks.current.forEach(cb => cb(data));
};
setTerminalWs(ws);

// In disconnect()
terminalWs?.close();
setTerminalWs(null);
setTerminalOutput([]);

// Helper functions
const sendToTerminal = (data: string) => {
  if (terminalWs?.readyState === WebSocket.OPEN) {
    terminalWs.send(data);
  }
};

const onTerminalOutput = (callback: (data: string) => void) => {
  outputCallbacks.current.add(callback);
  return () => outputCallbacks.current.delete(callback);
};
```

### ClaudeTerminal.tsx (simplified)

```typescript
function ClaudeTerminal() {
  const { terminalWs, terminalOutput, sendToTerminal, onTerminalOutput } = useDeveloper();
  const xtermRef = useRef<Terminal | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create xterm
    const term = new Terminal({ /* options */ });
    term.open(containerRef.current!);
    xtermRef.current = term;

    // Replay buffered output
    terminalOutput.forEach(data => term.write(data));

    // Subscribe to new output
    const unsub = onTerminalOutput(data => term.write(data));

    // Handle user input
    term.onData(data => sendToTerminal(data));

    return () => {
      unsub();
      term.dispose();
    };
  }, []);

  return <div ref={containerRef} className="h-full" />;
}
```

---

## Benefits

1. **Single connection** - WebSocket created once on "Connect", closed on "Disconnect"
2. **Navigate freely** - Go to session-logs, project-management, come back seamlessly
3. **Output preserved** - Last 1000 output chunks buffered, replayed on return
4. **Simple component** - ClaudeTerminal just renders, no connection logic
5. **Existing patterns** - Builds on DeveloperContext that already handles session

---

## Edge Cases

- **Browser refresh**: WebSocket lost (expected), user must reconnect
- **Network drop**: Add reconnection logic in context
- **Multiple tabs**: Each tab has own session (already enforced by dev team locking)
