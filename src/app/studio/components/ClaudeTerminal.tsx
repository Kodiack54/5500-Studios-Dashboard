'use client';

/**
 * ClaudeTerminal.tsx - Claude Terminal Interface
 * Location: kodiack-dashboard-5500/src/app/studio/components/
 *
 * Terminal interface for communicating with Claude Code on the server.
 * Uses API routes to bridge to the MCP Claude connection.
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface Message {
  id: string;
  type: 'user' | 'claude' | 'system' | 'error';
  content: string;
  timestamp: Date;
}

interface ClaudeTerminalProps {
  className?: string;
}

export function ClaudeTerminal({ className = '' }: ClaudeTerminalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add a system message
  const addMessage = (type: Message['type'], content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Check connection status
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/claude/status');
      const data = await res.json();
      setIsConnected(data.connected);
      return data.connected;
    } catch {
      setIsConnected(false);
      return false;
    }
  };

  // Connect to Claude terminal
  const connect = async () => {
    setIsConnecting(true);
    addMessage('system', 'Connecting to Claude terminal...');

    try {
      const res = await fetch('/api/claude/connect', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setIsConnected(true);
        addMessage('system', 'Connected to Claude terminal at port 5400');
      } else {
        addMessage('error', `Failed to connect: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      addMessage('error', `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Send message to Claude
  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    const message = input.trim();
    setInput('');
    addMessage('user', message);
    setIsSending(true);

    try {
      const res = await fetch('/api/claude/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: message }),
      });
      const data = await res.json();

      if (data.success) {
        addMessage('claude', data.response || 'Command sent successfully');
      } else {
        addMessage('error', data.error || 'Failed to send message');
      }
    } catch (err) {
      addMessage('error', `Send error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle keyboard input
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Get output from Claude terminal
  const getOutput = async () => {
    try {
      const res = await fetch('/api/claude/output');
      const data = await res.json();
      if (data.output) {
        addMessage('claude', data.output);
      }
    } catch (err) {
      addMessage('error', `Output error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className={`flex flex-col h-full bg-gray-850 ${className}`}>
      {/* Terminal Header */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Claude Terminal</span>
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>
        <div className="flex items-center gap-1">
          {isConnected ? (
            <button
              onClick={getOutput}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
              title="Refresh output"
            >
              Refresh
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-auto p-3 font-mono text-sm space-y-2">
        {messages.length === 0 ? (
          <>
            <div className="text-gray-500">
              {isConnected ? 'Claude terminal connected.' : 'Claude terminal not connected.'}
            </div>
            <div className="text-gray-400 mt-2">
              {isConnected
                ? 'Type a message and press Enter to send.'
                : 'Click "Connect" to establish a connection to Claude Code.'}
            </div>
          </>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`${
                msg.type === 'user'
                  ? 'text-blue-400'
                  : msg.type === 'claude'
                  ? 'text-green-400'
                  : msg.type === 'error'
                  ? 'text-red-400'
                  : 'text-gray-500'
              }`}
            >
              <span className="opacity-50 mr-2">
                {msg.type === 'user' ? '❯' : msg.type === 'claude' ? '◆' : msg.type === 'error' ? '✕' : '●'}
              </span>
              <span className="whitespace-pre-wrap">{msg.content}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Terminal Input */}
      <div className="border-t border-gray-700 p-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className={isConnected ? 'text-blue-400' : 'text-gray-600'}>❯</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Send a message to Claude...' : 'Connect to send messages'}
            disabled={!isConnected || isSending}
            className="flex-1 bg-transparent border-0 text-white text-sm focus:outline-none disabled:text-gray-600 placeholder-gray-600"
          />
          {isSending && <span className="text-gray-500 text-xs">Sending...</span>}
        </div>
      </div>
    </div>
  );
}
