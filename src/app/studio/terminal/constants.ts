// Terminal configuration constants

// AI Team URLs (Development droplet - Global ports 5400-5407)
export const DEV_DROPLET = '161.35.229.220';
export const CHAD_WS_URL = `ws://${DEV_DROPLET}:5401/ws`; // 01 - WebSocket path for Chad
export const SUSAN_URL = `http://${DEV_DROPLET}:5403`;    // 03 - Classification & Sorting

// Chunk size for long messages
export const CHUNK_SIZE = 1000;

// Debounce delay for chat message output (ms)
export const CHAT_DEBOUNCE_MS = 1500;

// Minimum content length for chat messages
export const MIN_CONTENT_LENGTH = 20;

// Dedup cooldown (ms) - should match CHAT_DEBOUNCE_MS
export const DEDUP_COOLDOWN_MS = 1500;

// Timer for Susan briefing (ms) - wait for Claude to fully load then send briefing
export const BRIEFING_FALLBACK_MS = 25000;

// Delay before showing messages after briefing (ms)
export const POST_BRIEFING_DELAY_MS = 5000;
