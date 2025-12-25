// Chat message filtering - strips TUI noise from terminal output

/**
 * Clean ANSI escape codes from terminal output
 */
export function cleanAnsiCodes(data: string): string {
  return data
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\x1b\[[0-9;]*[ABCDEFGHJKSTfnsu]/g, '')
    .replace(/\x1b\[[0-9;]*[JK]/g, '')
    .replace(/\x1b\[\?[0-9;]*[hl]/g, '')
    .replace(/\x1b[()][AB0-2]/g, '')
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '')
    .replace(/\x1b\][^\x07]*\x07/g, '')
    .replace(/\x1b[^[]\S?/g, '')
    .replace(/\r(?!\n)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Check if a line should be filtered from chat display
 */
export function shouldFilterLine(trimmed: string): boolean {
  if (!trimmed) return false;

  // Filter Susan's briefing content
  if (trimmed.includes('LAST SESSION') ||
      trimmed.includes('RECENT CONVERSATION') ||
      trimmed.includes('KEY KNOWLEDGE') ||
      trimmed.includes('END BRIEFING') ||
      trimmed.includes("I've gathered") ||
      trimmed.includes('Ready to continue') ||
      trimmed.includes("What's the priority") ||
      trimmed.includes('Summary:') ||
      trimmed.startsWith('You:') ||
      trimmed.startsWith('Claude:') ||
      /^\s*\w*-?\w*\]/.test(trimmed) ||
      /\[[\w-]+\]/.test(trimmed) ||
      /^[⏰💬🧠📋]/.test(trimmed) ||
      /^\[\d+/.test(trimmed) ||
      trimmed === 'm' ||
      trimmed === 'claude') return true;

  // Spinners and thinking indicators
  if (/^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏·✢✶✻✽∴]+/.test(trimmed)) return true;
  if (/Flibbertigibbet|Cogitating|Ruminating|Pondering|Cerebrating/i.test(trimmed)) return true;

  // Claude Code help/info text
  if (trimmed.includes('.claude/commands/')) return true;
  if (trimmed.includes('commands that work in any project')) return true;
  if (trimmed.includes('~/.claude/')) return true;

  // Tool output and TUI prompts
  if (trimmed.includes('tool uses')) return true;
  if (trimmed.includes('ctrl+o to')) return true;
  if (trimmed.includes('ctrl+b to')) return true;
  if (trimmed.includes('Do you want to proceed')) return true;
  if (trimmed.includes('Esc to cancel')) return true;
  if (trimmed.includes('MCP tools')) return true;
  if (trimmed.startsWith('Explore(')) return true;
  if (trimmed.startsWith('Read ') && trimmed.includes(' lines')) return true;
  if (/^\+\d+ more/.test(trimmed)) return true;
  if (/^❯\s*\d+\./.test(trimmed)) return true;
  if (trimmed === '1. Yes' || trimmed === '2. Yes,' || trimmed.startsWith('3. Type here')) return true;

  // Horizontal separators
  if (/^[\s─━═\-─━┄┅┈┉╌╍]+$/.test(trimmed)) return true;

  // TUI box structure
  if (trimmed.includes('│') && trimmed.replace(/[│\s]/g, '').length < 20) return true;
  if (/^[╭╮╯╰┌┐└┘├┤┬┴┼│─═║]+/.test(trimmed)) return true;

  // Try/Tip messages
  if (trimmed.startsWith('Try "') || trimmed.startsWith("Try '")) return true;
  if (trimmed.includes('Tip:') || trimmed.startsWith('⎿') || trimmed.includes('⎿')) return true;

  // Thinking/status indicators
  if (trimmed.includes('Thinking') || trimmed.includes('Ideating')) return true;
  if (trimmed.includes('Thought for')) return true;
  if (trimmed.includes('Using tool:')) return true;
  if (trimmed.includes('Crunching')) return true;
  if (trimmed.includes('⏵⏵')) return true;

  // Prompts
  if (trimmed === '>' || trimmed === '❯' || trimmed === '$') return true;
  if (/^>\s*.+/.test(trimmed)) return true;

  // Claude Code TUI header
  if (trimmed.includes('Claude Code v') || trimmed.includes('Welcome back')) return true;
  if (trimmed.includes('Tips for') || trimmed.includes('Run /init')) return true;

  return false;
}

/**
 * Filter terminal output for chat display
 */
export function filterForChat(rawData: string): string {
  const cleanData = cleanAnsiCodes(rawData);
  const lines = cleanData.split('\n');
  let buffer = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed && !buffer) continue;
    if (!trimmed) {
      buffer += '\n';
      continue;
    }
    if (shouldFilterLine(trimmed)) continue;
    buffer += line + '\n';
  }

  return buffer;
}
