'use client';

import { useState, useEffect, useRef } from 'react';
import { getPipelineServices, getAITeamServices, StudioService } from '../config';
import { FeedEvent } from '../lib/types';

type TabGroup = 'pipeline' | 'ai_team';

interface StudioLiveFeedProps {
  selectedServiceId?: string | null;
  onServiceSelect?: (serviceId: string) => void;
}

// Simulated feed events (will be replaced with real 9500 feed)
function generateMockEvent(services: StudioService[]): FeedEvent {
  const service = services[Math.floor(Math.random() * services.length)];
  const types: FeedEvent['type'][] = ['emit', 'receive', 'process', 'write'];
  const messages = [
    'Session packet received',
    'Context flip processed',
    'Heartbeat logged',
    'Transcript chunk ingested',
    'Worklog entry created',
    'Knowledge item indexed',
    'Todo extracted',
    'Structure updated',
  ];

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    serviceId: service.id,
    type: types[Math.floor(Math.random() * types.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    timestamp: Date.now(),
  };
}

export default function StudioLiveFeed({
  selectedServiceId,
  onServiceSelect,
}: StudioLiveFeedProps) {
  const [activeGroup, setActiveGroup] = useState<TabGroup>('pipeline');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pipelineServices = getPipelineServices();
  const aiTeamServices = getAITeamServices();

  // Get current services based on active group
  const currentServices = activeGroup === 'pipeline' ? pipelineServices : aiTeamServices;

  // Filter events based on active group and filter
  const filteredEvents = events.filter(event => {
    const serviceIds = currentServices.map(s => s.id);
    if (!serviceIds.includes(event.serviceId)) return false;
    if (activeFilter === 'all') return true;
    return event.serviceId === activeFilter;
  });

  // TODO: Replace with real WebSocket/SSE connection to 9500
  useEffect(() => {
    if (paused) return;

    // Simulate incoming events for demo
    const interval = setInterval(() => {
      const allServices = [...pipelineServices, ...aiTeamServices];
      const newEvent = generateMockEvent(allServices);
      setEvents(prev => [...prev.slice(-99), newEvent]);
    }, 2000);

    return () => clearInterval(interval);
  }, [paused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredEvents, paused]);

  // Sync selected service to filter
  useEffect(() => {
    if (selectedServiceId) {
      const isPipeline = pipelineServices.some(s => s.id === selectedServiceId);
      const isAI = aiTeamServices.some(s => s.id === selectedServiceId);
      if (isPipeline) {
        setActiveGroup('pipeline');
        setActiveFilter(selectedServiceId);
      } else if (isAI) {
        setActiveGroup('ai_team');
        setActiveFilter(selectedServiceId);
      }
    }
  }, [selectedServiceId]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const typeBadges: Record<FeedEvent['type'], string> = {
    emit: 'bg-purple-500/20 text-purple-400',
    receive: 'bg-blue-500/20 text-blue-400',
    process: 'bg-cyan-500/20 text-cyan-400',
    write: 'bg-green-500/20 text-green-400',
    error: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="h-full flex flex-col bg-gray-800/50 rounded-lg border border-gray-700">
      {/* Header with Tab Groups */}
      <div className="border-b border-gray-700">
        {/* Group Tabs */}
        <div className="flex items-center gap-2 px-3 pt-2">
          <button
            onClick={() => {
              setActiveGroup('pipeline');
              setActiveFilter('all');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
              activeGroup === 'pipeline'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Pipeline
          </button>
          <button
            onClick={() => {
              setActiveGroup('ai_team');
              setActiveFilter('all');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
              activeGroup === 'ai_team'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            AI Team
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setPaused(!paused)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              paused
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
            }`}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>

        {/* Service Filter Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-1 text-[10px] rounded whitespace-nowrap transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-500/30 text-blue-300'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            All {activeGroup === 'pipeline' ? 'Pipeline' : 'AI'}
          </button>
          {currentServices.map(service => (
            <button
              key={service.id}
              onClick={() => {
                setActiveFilter(service.id);
                onServiceSelect?.(service.id);
              }}
              className={`px-2 py-1 text-[10px] rounded whitespace-nowrap transition-colors ${
                activeFilter === service.id
                  ? 'bg-blue-500/30 text-blue-300'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {service.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {paused ? 'Feed paused' : 'Waiting for events...'}
          </div>
        ) : (
          filteredEvents.map(event => {
            const service = [...pipelineServices, ...aiTeamServices].find(
              s => s.id === event.serviceId
            );
            return (
              <div
                key={event.id}
                className="flex items-start gap-2 py-0.5 hover:bg-gray-700/50 px-1 rounded cursor-pointer"
                onClick={() => onServiceSelect?.(event.serviceId)}
              >
                <span className="text-gray-600 flex-shrink-0">
                  {formatTime(event.timestamp)}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase flex-shrink-0 ${
                    typeBadges[event.type]
                  }`}
                >
                  {event.type}
                </span>
                <span className="text-cyan-400 flex-shrink-0">
                  [{service?.label || event.serviceId}]
                </span>
                <span className="text-gray-300">{event.message}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Status */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-700 text-[10px] text-gray-500">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              paused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'
            }`}
          />
          <span>{paused ? 'Paused' : 'Live'}</span>
        </div>
        <span>{filteredEvents.length} events</span>
      </div>
    </div>
  );
}
